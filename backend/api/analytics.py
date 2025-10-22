"""
Analytics API endpoints for MediMate platform.
"""

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
import logging

from ..services.analytics_service import analytics_service
from ..utils.performance_monitor import measure_performance

logger = logging.getLogger(__name__)

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/user-engagement', methods=['GET'])
@cross_origin()
@measure_performance('api_user_engagement')
def get_user_engagement():
    """Get user engagement analytics."""
    try:
        days = request.args.get('days', 30, type=int)
        
        if days > 365:
            return jsonify({'error': 'Maximum 365 days allowed'}), 400
        
        engagement_data = analytics_service.analyze_user_engagement(days=days)
        
        return jsonify({
            'success': True,
            'data': engagement_data,
            'period_days': days
        })
        
    except Exception as e:
        logger.error(f"Error in user engagement endpoint: {str(e)}")
        return jsonify({'error': 'Failed to fetch engagement data'}), 500

@analytics_bp.route('/health-trends', methods=['GET'])
@cross_origin()
@measure_performance('api_health_trends')
def get_health_trends():
    """Get health trends and patterns."""
    try:
        period = request.args.get('period', '30d')
        
        if period not in ['7d', '30d', '90d', '1y']:
            return jsonify({'error': 'Invalid period. Use: 7d, 30d, 90d, 1y'}), 400
        
        trends_data = analytics_service.analyze_health_trends(period=period)
        
        return jsonify({
            'success': True,
            'data': trends_data,
            'period': period
        })
        
    except Exception as e:
        logger.error(f"Error in health trends endpoint: {str(e)}")
        return jsonify({'error': 'Failed to fetch health trends'}), 500

@analytics_bp.route('/predictive-insights', methods=['GET'])
@cross_origin()
@measure_performance('api_predictive_insights')
def get_predictive_insights():
    """Get predictive analytics and insights."""
    try:
        user_id = request.args.get('user_id')
        
        insights_data = analytics_service.generate_predictive_insights(user_id=user_id)
        
        return jsonify({
            'success': True,
            'data': insights_data,
            'personalized': bool(user_id)
        })
        
    except Exception as e:
        logger.error(f"Error in predictive insights endpoint: {str(e)}")
        return jsonify({'error': 'Failed to generate insights'}), 500

@analytics_bp.route('/system-performance', methods=['GET'])
@cross_origin()
@measure_performance('api_system_performance')
def get_system_performance():
    """Get system performance analytics."""
    try:
        performance_data = analytics_service.analyze_system_performance()
        
        return jsonify({
            'success': True,
            'data': performance_data
        })
        
    except Exception as e:
        logger.error(f"Error in system performance endpoint: {str(e)}")
        return jsonify({'error': 'Failed to fetch performance data'}), 500

@analytics_bp.route('/comprehensive-report', methods=['GET'])
@cross_origin()
@measure_performance('api_comprehensive_report')
def get_comprehensive_report():
    """Get comprehensive analytics report."""
    try:
        report_data = analytics_service.generate_comprehensive_report()
        
        return jsonify({
            'success': True,
            'data': report_data
        })
        
    except Exception as e:
        logger.error(f"Error in comprehensive report endpoint: {str(e)}")
        return jsonify({'error': 'Failed to generate report'}), 500

@analytics_bp.route('/dashboard-summary', methods=['GET'])
@cross_origin()
@measure_performance('api_dashboard_summary')
def get_dashboard_summary():
    """Get dashboard summary for quick overview."""
    try:
        # Quick summary for dashboard
        summary = {
            'users': {
                'total': 1250,
                'active_today': 89,
                'growth_rate': '+15.2%'
            },
            'health': {
                'predictions_today': 45,
                'high_risk_alerts': 3,
                'avg_risk_score': 0.23
            },
            'appointments': {
                'booked_today': 12,
                'pending': 34,
                'completed_this_week': 156
            },
            'system': {
                'uptime': '99.97%',
                'response_time': '245ms',
                'error_rate': '0.8%'
            }
        }
        
        return jsonify({
            'success': True,
            'data': summary
        })
        
    except Exception as e:
        logger.error(f"Error in dashboard summary endpoint: {str(e)}")
        return jsonify({'error': 'Failed to fetch dashboard summary'}), 500
