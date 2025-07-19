
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keysystemId = searchParams.get('keysystemId');

    if (!keysystemId) {
      return NextResponse.json({ error: 'Keysystem ID is required' }, { status: 400 });
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const customersCollection = db.collection('customers');
    const sessionsCollection = db.collection('sessions');

    // Find user by Discord refresh token
    const user = await customersCollection.findOne({ token: token });

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is activated
    if (!user.activated) {
      return NextResponse.json({ error: 'Account not activated' }, { status: 403 });
    }

    // Find the specific keysystem
    const keysystem = user.keysystems?.find(ks => ks.id === keysystemId);
    if (!keysystem) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    // Get session statistics for this keysystem
    const sessions = await sessionsCollection.find({ 
      keysystem_id: keysystemId 
    }).toArray();

    // Calculate statistics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.completed).length;
    const activeSessions = sessions.filter(s => !s.completed && !s.expired).length;
    const expiredSessions = sessions.filter(s => s.expired).length;

    // Group sessions by date for time series data
    const sessionsByDate = {};
    sessions.forEach(session => {
      const date = new Date(session.created_at).toISOString().split('T')[0];
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = { completed: 0, total: 0 };
      }
      sessionsByDate[date].total++;
      if (session.completed) {
        sessionsByDate[date].completed++;
      }
    });

    // Convert to array for charts
    const timeSeriesData = Object.entries(sessionsByDate)
      .map(([date, data]) => ({
        date,
        completed: data.completed,
        total: data.total,
        completion_rate: ((data.completed / data.total) * 100).toFixed(1)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Last 30 days

    // Calculate completion rates by checkpoint
    const checkpointStats = {};
    if (keysystem.checkpoints) {
      keysystem.checkpoints.forEach((checkpoint, index) => {
        const checkpointSessions = sessions.filter(s => 
          s.current_checkpoint >= index && s.completed
        );
        checkpointStats[`Checkpoint ${index + 1}`] = {
          completed: checkpointSessions.length,
          total: sessions.filter(s => s.current_checkpoint >= index).length
        };
      });
    }

    const checkpointData = Object.entries(checkpointStats).map(([name, data]) => ({
      name,
      completion_rate: data.total > 0 ? ((data.completed / data.total) * 100).toFixed(1) : 0,
      completed: data.completed,
      total: data.total
    }));

    // Pie chart data for session status
    const statusData = [
      { name: 'Completed', value: completedSessions, color: '#22c55e' },
      { name: 'Active', value: activeSessions, color: '#3b82f6' },
      { name: 'Expired', value: expiredSessions, color: '#ef4444' }
    ].filter(item => item.value > 0);

    // Calculate overall completion rate
    const completionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0;

    return NextResponse.json({
      success: true,
      keysystem: {
        id: keysystem.id,
        name: keysystem.name,
        active: keysystem.active
      },
      statistics: {
        overview: {
          total_sessions: totalSessions,
          completed_sessions: completedSessions,
          active_sessions: activeSessions,
          expired_sessions: expiredSessions,
          completion_rate: parseFloat(completionRate)
        },
        time_series: timeSeriesData,
        checkpoint_performance: checkpointData,
        status_distribution: statusData
      }
    });

  } catch (error) {
    console.error('Statistics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}