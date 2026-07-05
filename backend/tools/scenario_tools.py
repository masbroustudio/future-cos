from typing import List, Dict, Any
from langchain_core.tools import tool

@tool
def calculate_revenue_scenario(
    base_monthly_revenue: float,
    growth_rate_change: float,       # delta % (e.g. +0.02 = +2% growth monthly)
    months: int = 12,
    churn_rate: float = 0.02
) -> dict:
    """
    Calculate pure deterministic revenue projection for the next few months
    comparing the baseline (0% growth change) vs the new growth scenario.
    
    Args:
        base_monthly_revenue: Current monthly revenue (baseline).
        growth_rate_change: Percentage change in monthly growth rate (e.g. 0.03 for +3% per month).
        months: Projection months (default 12).
        churn_rate: Monthly customer churn rate (default 2% or 0.02).
        
    Returns:
        Dictionary containing monthly 'projections' array, total revenue delta, and % change.
    """
    projections = []
    baseline_rev = base_monthly_revenue
    scenario_rev = base_monthly_revenue
    
    total_baseline = 0.0
    total_scenario = 0.0
    
    # Simple MRR/Subscription growth formula: Rev_t = Rev_{t-1} * (1 + growth - churn)
    for m in range(1, months + 1):
        # Baseline: assume no growth change, just simple churn/retention balance (stable)
        baseline_rev = baseline_rev * (1 - 0.005) # small decay
        # Scenario: applies the growth rate change
        scenario_rev = scenario_rev * (1 + growth_rate_change - churn_rate)
        
        total_baseline += baseline_rev
        total_scenario += scenario_rev
        
        projections.append({
            "month": f"M-{m:02d}",
            "baseline": round(baseline_rev, 2),
            "scenario": round(scenario_rev, 2)
        })
        
    delta = total_scenario - total_baseline
    pct_change = (delta / total_baseline) if total_baseline > 0 else 0
    
    return {
        "projections": projections,
        "total_revenue_baseline": round(total_baseline, 2),
        "total_revenue_scenario": round(total_scenario, 2),
        "revenue_delta": round(delta, 2),
        "revenue_delta_percent": round(pct_change, 4)
    }

@tool
def calculate_hiring_impact(
    headcount_delta: int,
    avg_annual_salary: float,
    ramp_months: int = 3,
    revenue_per_head_monthly: float = 0.0,
    current_cash: float = 750000000.0,
    current_monthly_burn: float = 91500000.0
) -> dict:
    """
    Calculate the impact of hiring new staff on monthly burn rate and cash runway.
    
    Args:
        headcount_delta: Number of new staff to hire.
        avg_annual_salary: Average annual salary per staff.
        ramp_months: Transition time (months) before new staff becomes productive and generates revenue.
        revenue_per_head_monthly: Expected monthly revenue contribution per head after ramp-up.
        current_cash: Current cash balance (currency).
        current_monthly_burn: Current monthly burn rate (currency).
        
    Returns:
        Dictionary containing new burn rate, new runway, additional monthly expenditure, and break-even month.
    """
    # Monthly cost per new head = Annual salary / 12
    monthly_cost_per_head = avg_annual_salary / 12
    additional_monthly_burn = monthly_cost_per_head * headcount_delta
    new_monthly_burn = current_monthly_burn + additional_monthly_burn
    
    # Cash runway calculations (baseline vs scenario)
    baseline_runway = current_cash / current_monthly_burn if current_monthly_burn > 0 else 99
    new_runway_immediate = current_cash / new_monthly_burn if new_monthly_burn > 0 else 99
    
    # Calculate projection over 12 months taking ramp-up and revenue contribution into account
    projections = []
    cash = current_cash
    
    for m in range(1, 13):
        # Staf mulai kontribusi revenue setelah ramp_months
        m_rev = revenue_per_head_monthly * headcount_delta if m > ramp_months else 0.0
        net_burn = new_monthly_burn - m_rev
        cash -= net_burn
        
        projections.append({
            "month": f"M-{m:02d}",
            "cash_baseline": max(0, round(current_cash - (current_monthly_burn * m), 2)),
            "cash_scenario": max(0, round(cash, 2))
        })
        
    # Break even months = cost / revenue
    break_even_months = None
    if revenue_per_head_monthly > 0:
        total_revenue_contribution = revenue_per_head_monthly * headcount_delta
        if total_revenue_contribution > additional_monthly_burn:
            break_even_months = additional_monthly_burn / (total_revenue_contribution - additional_monthly_burn)
            break_even_months = round(break_even_months, 1) + ramp_months
            
    return {
        "additional_monthly_burn": round(additional_monthly_burn, 2),
        "new_monthly_burn": round(new_monthly_burn, 2),
        "baseline_runway_months": round(baseline_runway, 1),
        "new_runway_months": round(new_runway_immediate, 1),
        "break_even_months": break_even_months,
        "projections": projections
    }

@tool
def calculate_pricing_impact(
    current_price: float,
    new_price: float,
    price_elasticity: float,        # e.g. -1.5 (elastic), -0.5 (inelastic)
    current_volume: int,
    cost_per_unit: float = 0.0
) -> dict:
    """
    Calculate the impact of a product price change on sales volume and gross margin based on price elasticity.
    
    Args:
        current_price: Current selling price.
        new_price: Proposed new selling price.
        price_elasticity: Price elasticity coefficient (negative number, e.g. -1.5).
        current_volume: Current monthly sales volume (units/users).
        cost_per_unit: Cost of goods sold per unit (COGS), default 0.
        
    Returns:
        Dictionary containing new volume, new revenue, new gross profit, and change delta.
    """
    # Price change percentage
    price_change_pct = (new_price - current_price) / current_price
    
    # Quantity change percentage = Elasticity * Price change %
    volume_change_pct = price_elasticity * price_change_pct
    
    # New volume
    new_volume = round(current_volume * (1 + volume_change_pct))
    new_volume = max(0, new_volume)
    
    # Revenue comparison
    current_revenue = current_price * current_volume
    new_revenue = new_price * new_volume
    revenue_delta = new_revenue - current_revenue
    
    # Profit comparison
    current_profit = (current_price - cost_per_unit) * current_volume
    new_profit = (new_price - cost_per_unit) * new_volume
    profit_delta = new_profit - current_profit
    
    # Projections chart (5 steps price comparison around new price)
    projections = []
    step_pcts = [-0.10, -0.05, 0.0, 0.05, 0.10]
    for step in step_pcts:
        p = new_price * (1 + step)
        v = max(0, round(current_volume * (1 + price_elasticity * ((p - current_price) / current_price))))
        projections.append({
            "label": f"{step*100:+.0f}% P",
            "price": round(p, 2),
            "revenue": round(p * v, 2)
        })
        
    return {
        "new_volume": new_volume,
        "volume_change_percent": round(volume_change_pct, 4),
        "current_monthly_revenue": round(current_revenue, 2),
        "new_monthly_revenue": round(new_revenue, 2),
        "revenue_change": round(revenue_delta, 2),
        "revenue_change_percent": round(revenue_delta / current_revenue if current_revenue > 0 else 0, 4),
        "current_monthly_profit": round(current_profit, 2),
        "new_monthly_profit": round(new_profit, 2),
        "profit_change": round(profit_delta, 2),
        "projections": projections
    }

@tool
def render_scenario_chart(
    scenario_type: str,              # "revenue_growth" | "hiring" | "pricing"
    title: str,
    summary_metrics: dict,
    projections: list,
    reasoning_trail: dict
) -> str:
    """
    Display the What-If scenario visual trend chart on the user's chat screen (Generative UI).
    Call this tool after you finish calculating with the scenario_tools calculator.
    
    Args:
        scenario_type: Simulation category ('revenue_growth', 'hiring', or 'pricing').
        title: Simulation scenario title (e.g. 'Price Increase Simulation +10%').
        summary_metrics: Collection of key output metrics (delta, new burn rate, new runway, etc).
        projections: List of monthly data points to draw on the chart.
        reasoning_trail: AI reasoning trail.
    """
    return "Displaying Scenario Simulation Chart..."
