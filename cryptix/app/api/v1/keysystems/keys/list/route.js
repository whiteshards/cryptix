
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { searchParams } = new URL(request.url);
    
    const keysystemId = searchParams.get('keysystemId');
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, oldest
    const filterExpires = searchParams.get('filterExpires') || 'all'; // all, soon
    const filterHwid = searchParams.get('filterHwid') || 'all'; // all, linked, not_linked
    const filterStatus = searchParams.get('filterStatus') || 'all'; // all, active, expired

    if (!keysystemId) {
      return NextResponse.json({ error: 'Keysystem ID is required' }, { status: 400 });
    }

    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Verify user owns the keysystem
    const user = await collection.findOne({ 
      token: token,
      'keysystems.id': keysystemId
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid token or keysystem not found' }, { status: 401 });
    }

    // Get all sessions for this keysystem and aggregate keys
    const sessionsCollection = db.collection('sessions');
    
    let matchStage = { keysystem_id: keysystemId };
    let pipeline = [
      { $match: matchStage },
      { $unwind: '$keys' },
      {
        $addFields: {
          'keys.session_id': '$session_id',
          'keys.hwid': '$hwid',
          'keys.status': {
            $cond: {
              if: { $lt: ['$keys.expires_at', new Date()] },
              then: 'expired',
              else: 'active'
            }
          }
        }
      },
      { $replaceRoot: { newRoot: '$keys' } }
    ];

    // Apply filters
    let filterStage = {};
    
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        filterStage.expires_at = { $gt: new Date() };
      } else if (filterStatus === 'expired') {
        filterStage.expires_at = { $lte: new Date() };
      }
    }

    if (filterExpires === 'soon') {
      const soonDate = new Date();
      soonDate.setHours(soonDate.getHours() + 24); // Next 24 hours
      filterStage.expires_at = { 
        $gt: new Date(), 
        $lte: soonDate 
      };
    }

    if (filterHwid === 'linked') {
      filterStage.hwid = { $ne: null, $exists: true };
    } else if (filterHwid === 'not_linked') {
      filterStage.$or = [
        { hwid: null },
        { hwid: { $exists: false } }
      ];
    }

    if (Object.keys(filterStage).length > 0) {
      pipeline.push({ $match: filterStage });
    }

    // Apply sorting
    let sortStage = {};
    if (sortBy === 'recent') {
      sortStage.created_at = -1;
    } else if (sortBy === 'oldest') {
      sortStage.created_at = 1;
    }

    pipeline.push({ $sort: sortStage });

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await sessionsCollection.aggregate(countPipeline).toArray();
    const totalKeys = countResult.length > 0 ? countResult[0].total : 0;

    // Apply pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });

    const keys = await sessionsCollection.aggregate(pipeline).toArray();

    const totalPages = Math.ceil(totalKeys / pageSize);

    return NextResponse.json({
      success: true,
      keys: keys,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalKeys: totalKeys,
        pageSize: pageSize
      }
    });

  } catch (error) {
    console.error('List keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
