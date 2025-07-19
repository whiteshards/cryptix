
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import clientPromise from '../../../../../lib/mongodb';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keysystemId = searchParams.get('keysystemId');

    if (!keysystemId) {
      return NextResponse.json({ error: 'Keysystem ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Cryptix');
    const customersCollection = db.collection('customers');
    const sessionsCollection = db.collection('sessions');
    const keysCollection = db.collection('keys');

    // Find the customer and verify ownership of keysystem
    const customer = await customersCollection.findOne({ 
      discord_id: decoded.discord_id,
      'keysystems.id': keysystemId
    });

    if (!customer) {
      return NextResponse.json({ error: 'Keysystem not found or access denied' }, { status: 404 });
    }

    const keysystem = customer.keysystems.find(ks => ks.id === keysystemId);

    // Get total keys count
    const totalKeys = await keysCollection.countDocuments({ keysystem_id: keysystemId });

    // Get active keys count (not expired)
    const activeKeys = await keysCollection.countDocuments({ 
      keysystem_id: keysystemId,
      expires_at: { $gt: new Date() }
    });

    // Get expired keys count
    const expiredKeys = totalKeys - activeKeys;

    // Get total sessions count
    const totalSessions = await sessionsCollection.countDocuments({ keysystem_id: keysystemId });

    // Get completed sessions count
    const completedSessions = await sessionsCollection.countDocuments({ 
      keysystem_id: keysystemId,
      completed: true
    });

    // Get failed sessions count
    const failedSessions = totalSessions - completedSessions;

    // Get keys created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentKeys = await keysCollection.countDocuments({ 
      keysystem_id: keysystemId,
      created_at: { $gte: sevenDaysAgo }
    });

    // Get daily statistics for the last 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const keysCreated = await keysCollection.countDocuments({
        keysystem_id: keysystemId,
        created_at: { $gte: startOfDay, $lt: endOfDay }
      });

      const sessionsCreated = await sessionsCollection.countDocuments({
        keysystem_id: keysystemId,
        created_at: { $gte: startOfDay, $lt: endOfDay }
      });

      const sessionsCompleted = await sessionsCollection.countDocuments({
        keysystem_id: keysystemId,
        completed: true,
        completed_at: { $gte: startOfDay, $lt: endOfDay }
      });

      dailyStats.push({
        date: startOfDay.toISOString().split('T')[0],
        keys: keysCreated,
        sessions: sessionsCreated,
        completed: sessionsCompleted
      });
    }

    // Get checkpoint completion statistics
    const checkpointStats = [];
    if (keysystem.checkpoints && keysystem.checkpoints.length > 0) {
      for (let i = 0; i < keysystem.checkpoints.length; i++) {
        const checkpoint = keysystem.checkpoints[i];
        const completedCount = await sessionsCollection.countDocuments({
          keysystem_id: keysystemId,
          [`progress.${i}.completed`]: true
        });

        checkpointStats.push({
          index: i,
          name: `Step ${i + 1}`,
          type: checkpoint.type,
          completed: completedCount,
          completion_rate: totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0
        });
      }
    }

    // Get hourly distribution of key creation (last 24 hours)
    const hourlyStats = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - i);
      const startHour = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours());
      const endHour = new Date(startHour);
      endHour.setHours(endHour.getHours() + 1);

      const keysInHour = await keysCollection.countDocuments({
        keysystem_id: keysystemId,
        created_at: { $gte: startHour, $lt: endHour }
      });

      hourlyStats.push({
        hour: startHour.getHours(),
        keys: keysInHour
      });
    }

    return NextResponse.json({
      success: true,
      keysystem: {
        id: keysystem.id,
        name: keysystem.name,
        active: keysystem.active,
        created_at: keysystem.createdAt
      },
      statistics: {
        keys: {
          total: totalKeys,
          active: activeKeys,
          expired: expiredKeys,
          recent: recentKeys
        },
        sessions: {
          total: totalSessions,
          completed: completedSessions,
          failed: failedSessions,
          completion_rate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
        },
        daily_stats: dailyStats,
        checkpoint_stats: checkpointStats,
        hourly_stats: hourlyStats
      }
    });

  } catch (error) {
    console.error('Statistics fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
