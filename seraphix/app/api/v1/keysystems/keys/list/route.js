
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

    // Find the specific keysystem
    const keysystem = user.keysystems.find(ks => ks.id === keysystemId);

    if (!keysystem) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    // Get all keys from the keysystem.keys object
    let allKeys = [];
    
    if (keysystem.keys) {
      // Iterate through all sessions in keysystem.keys
      Object.entries(keysystem.keys).forEach(([sessionId, sessionData]) => {
        if (sessionData.keys && Array.isArray(sessionData.keys)) {
          sessionData.keys.forEach(key => {
            allKeys.push({
              ...key,
              session_id: sessionId,
              hwid: sessionData.hwid || null,
              status: new Date(key.expires_at) > new Date() ? 'active' : 'expired'
            });
          });
        }
      });
    }

    // Apply filters
    let filteredKeys = allKeys;

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        filteredKeys = filteredKeys.filter(key => new Date(key.expires_at) > new Date());
      } else if (filterStatus === 'expired') {
        filteredKeys = filteredKeys.filter(key => new Date(key.expires_at) <= new Date());
      }
    }

    // Expires soon filter
    if (filterExpires === 'soon') {
      const soonDate = new Date();
      soonDate.setHours(soonDate.getHours() + 24); // Next 24 hours
      filteredKeys = filteredKeys.filter(key => 
        new Date(key.expires_at) > new Date() && 
        new Date(key.expires_at) <= soonDate
      );
    }

    // HWID filter
    if (filterHwid === 'linked') {
      filteredKeys = filteredKeys.filter(key => key.hwid && key.hwid !== null);
    } else if (filterHwid === 'not_linked') {
      filteredKeys = filteredKeys.filter(key => !key.hwid || key.hwid === null);
    }

    // Sort keys
    filteredKeys.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      
      if (sortBy === 'recent') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

    // Apply pagination
    const totalKeys = filteredKeys.length;
    const paginatedKeys = filteredKeys.slice(skip, skip + pageSize);

    return NextResponse.json({
      success: true,
      keys: paginatedKeys,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalKeys / pageSize),
        totalKeys: totalKeys,
        keysPerPage: pageSize
      }
    });

  } catch (error) {
    console.error('List keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
