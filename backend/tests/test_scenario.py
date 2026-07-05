import pytest
from tools.scenario_tools import calculate_revenue_scenario, calculate_hiring_impact, calculate_pricing_impact

def test_calculate_revenue_scenario():
    result = calculate_revenue_scenario.invoke({
        "base_monthly_revenue": 100000.0,
        "growth_rate_change": 0.05,
        "months": 3,
        "churn_rate": 0.02
    })
    
    assert "projections" in result
    assert len(result["projections"]) == 3
    # Check that scenario revenue is higher than baseline revenue
    assert result["projections"][2]["scenario"] > result["projections"][2]["baseline"]
    assert result["total_revenue_scenario"] > result["total_revenue_baseline"]
    assert result["revenue_delta"] > 0

def test_calculate_hiring_impact():
    result = calculate_hiring_impact.invoke({
        "headcount_delta": 2,
        "avg_annual_salary": 120000.0, # 10000/month per head -> 20000/month total additional burn
        "ramp_months": 2,
        "revenue_per_head_monthly": 15000.0, # 30000 total revenue contribution after ramp
        "current_cash": 100000.0,
        "current_monthly_burn": 10000.0
    })
    
    assert "projections" in result
    assert result["additional_monthly_burn"] == 20000.0
    assert result["new_monthly_burn"] == 30000.0
    assert result["break_even_months"] is not None
    # 20000 / (30000 - 20000) = 2.0 months + 2.0 ramp = 4.0 break even
    assert result["break_even_months"] == 4.0

def test_calculate_pricing_impact():
    result = calculate_pricing_impact.invoke({
        "current_price": 100.0,
        "new_price": 110.0, # +10% price change
        "price_elasticity": -0.5, # inelastic -> volume drops by 5%
        "current_volume": 1000,
        "cost_per_unit": 20.0
    })
    
    assert "new_volume" in result
    # Volume drop = -0.5 * 10% = -5% -> volume drops from 1000 to 950
    assert result["new_volume"] == 950
    # Current revenue = 100 * 1000 = 100000
    # New revenue = 110 * 950 = 104500
    assert result["current_monthly_revenue"] == 100000.0
    assert result["new_monthly_revenue"] == 104500.0
    assert result["revenue_change"] == 4500.0
    assert result["revenue_change_percent"] == 0.045
    # Current profit = (100 - 20) * 1000 = 80000
    # New profit = (110 - 20) * 950 = 85500
    assert result["current_monthly_profit"] == 80000.0
    assert result["new_monthly_profit"] == 85500.0
    assert result["profit_change"] == 5500.0
