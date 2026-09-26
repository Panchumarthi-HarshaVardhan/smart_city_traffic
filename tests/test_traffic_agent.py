"""
CITYFLOW AI - Traffic Intelligence Agent Test Suite

Verifies:
1. Intent classification & entity extraction
2. Factual tool invocation (TomTom, Google Routes, CITYFLOW ML)
3. Forecast boundary honesty (Bengaluru only, never fabricate for Hyderabad/Mumbai)
4. Nationwide query honesty (No false claims of nationwide visibility)
5. Evidence vs speculation distinction ("Why is traffic bad?")
6. Multi-turn bounded conversation context
7. Graceful degradation when Groq, TomTom, or Google is unavailable
8. No hallucinated traffic metrics or fake forecasts
"""

import pytest
from unittest.mock import patch
from backend.traffic_agent import (
    orchestrate_traffic_agent,
    detect_intent,
    extract_locations,
    tool_get_cityflow_forecast,
    tool_get_live_traffic,
    tool_get_traffic_aware_route,
    clear_session,
)


def test_detect_intent_classification():
    """Verify intent classifier categorizes queries correctly."""
    assert detect_intent("How is traffic in Bengaluru right now?") == "current_traffic"
    assert detect_intent("Why is traffic bad near Silk Board?") == "incident"
    assert detect_intent("Will traffic be bad tomorrow in Bengaluru?") == "forecast"
    assert detect_intent("Find a route from Hyderabad to Bengaluru.") == "route"
    assert detect_intent("Fastest traffic-aware route for an ambulance") == "emergency"
    assert detect_intent("What is happening across India?") == "nationwide"
    assert detect_intent("What is CITYFLOW AI and how does it predict?") == "general"


def test_generic_cityflow_question():
    """General CITYFLOW questions should explain architecture without calling live traffic tools."""
    res = orchestrate_traffic_agent("What is CITYFLOW AI?", conversation_id="t_general")
    assert res["intent"] == "general"
    assert "CITYFLOW AI Architecture" in res["sources"]
    assert len(res["answer"]) > 50
    # Must mention core components
    ans_lower = res["answer"].lower()
    assert any(k in ans_lower for k in ["traffic", "speed", "tomtom", "sensor"])
    assert any(k in ans_lower for k in ["route", "routing", "google routes"])
    assert any(k in ans_lower for k in ["ml", "forecast", "predict", "machine-learning", "machine learning"])


def test_current_traffic_query():
    """Current traffic query for Bengaluru must cite TomTom and report speed/condition."""
    res = orchestrate_traffic_agent("How is traffic in Bengaluru right now?", conversation_id="t_curr")
    assert res["intent"] == "current_traffic"
    assert any("TomTom" in s for s in res["sources"])
    assert "answer" in res
    assert len(res["answer"]) > 20


def test_forecast_bengaluru_validated_corridor():
    """Next-day forecast for a validated Bengaluru corridor must return CITYFLOW ML predictions."""
    res = orchestrate_traffic_agent("Will traffic be bad tomorrow near Silk Board Junction?", conversation_id="t_fc_blr")
    assert res["intent"] == "forecast"
    assert any("CITYFLOW ML" in s for s in res["sources"])
    assert "forecast" in res["data"]
    fc = res["data"]["forecast"]
    assert fc.get("hasMLCoverage") is True
    assert "predicted_congestion_level" in fc.get("data", {}) or "Silk Board" in res["answer"]


def test_unsupported_ml_location_forecast_honesty():
    """Next-day forecast for Hyderabad or Mumbai must NOT fabricate ML numbers, but cite Bengaluru limitation."""
    res = orchestrate_traffic_agent("What will traffic be tomorrow in Hyderabad?", conversation_id="t_fc_hyd")
    assert res["intent"] == "forecast"
    assert any("CITYFLOW ML" in s for s in res["sources"])
    fc = res["data"].get("forecast", {})
    assert fc.get("hasMLCoverage") is False
    # Answer must explicitly mention limitation to Bengaluru
    ans_lower = res["answer"].lower()
    assert "bengaluru" in ans_lower
    assert any(w in ans_lower for w in ["limited", "only available", "not available", "unavailable", "does not have", "don't have", "validated only", "only for", "validated for"])


def test_traffic_aware_route_query():
    """Route queries must invoke Google Routes (TRAFFIC_AWARE) and compare alternatives."""
    res = orchestrate_traffic_agent("Find a route from Hyderabad to Bengaluru", conversation_id="t_route")
    assert res["intent"] == "route"
    assert any("Google Routes" in s for s in res["sources"])
    r_data = res["data"].get("routing", {})
    assert r_data.get("available") is True
    assert len(r_data.get("routes", [])) > 0


def test_why_is_traffic_bad_investigation():
    """Why is traffic bad should query live flow + incidents and distinguish evidence from uncertainty."""
    res = orchestrate_traffic_agent("Why is traffic bad near Silk Board?", conversation_id="t_why")
    assert res["intent"] == "incident"
    assert any("TomTom" in s for s in res["sources"])
    assert "live_flow" in res["data"]
    assert "incidents" in res["data"]


def test_nationwide_traffic_honesty():
    """Nationwide traffic query must state coverage limitations and not hallucinate nationwide visibility."""
    res = orchestrate_traffic_agent("What is happening across India?", conversation_id="t_nation")
    assert res["intent"] == "nationwide"
    ans_lower = res["answer"].lower()
    assert "nationwide" in ans_lower or "monitored" in ans_lower or "coverage" in ans_lower


def test_conversation_context_memory():
    """Agent must resolve implicit context across multi-turn messages (e.g. 'What about tomorrow?')."""
    cid = "test_memory_turn"
    clear_session(cid)

    # Turn 1: Ask about Bengaluru
    r1 = orchestrate_traffic_agent("How is traffic in Bengaluru?", conversation_id=cid)
    assert r1["location"] == "Bengaluru"

    # Turn 2: Follow-up question without repeating city
    r2 = orchestrate_traffic_agent("What about tomorrow?", conversation_id=cid)
    assert r2["intent"] == "forecast"
    assert r2["location"] == "Bengaluru"

    clear_session(cid)


def test_groq_unavailable_graceful_fallback():
    """When Groq LLM API is unavailable, agent must gracefully fall back to deterministic synthesis."""
    with patch("backend.traffic_agent.generate_chat_completion") as mock_groq:
        mock_groq.return_value = {"success": False, "content": "", "error": "Groq API timeout"}

        res = orchestrate_traffic_agent("How is traffic in Bengaluru?", conversation_id="t_groq_down")
        assert res is not None
        assert "answer" in res
        assert len(res["answer"]) > 20
        # Deterministic fallback should still contain factual telemetry
        assert "CURRENT TRAFFIC" in res["answer"] or "Flowing" in res["answer"] or "TomTom" in res["answer"]


def test_tomtom_unavailable_graceful():
    """When TomTom API returns unavailable, agent must report honestly without fabricating data."""
    with patch("backend.traffic_agent.get_live_traffic_flow") as mock_flow:
        mock_flow.return_value = {
            "available": False,
            "source": "TomTom",
            "message": "Live traffic is temporarily unavailable."
        }

        res = orchestrate_traffic_agent("How is traffic in Hyderabad right now?", conversation_id="t_tomtom_down")
        assert "answer" in res
        # Should not invent speeds
        ans_lower = res["answer"].lower()
        assert any(w in ans_lower for w in ["unavailable", "does not have", "can't provide", "cannot provide", "not available", "no data"])


def test_coverage_areas_query():
    """Querying coverage must explain India-wide platform + Bengaluru ML forecast distinction."""
    res = orchestrate_traffic_agent("Which areas do you cover?", conversation_id="t_cov")
    assert res["intent"] == "coverage"
    assert "coverage" in res["data"]
    cov = res["data"]["coverage"]
    assert cov.get("platform_scope") == "India-wide"
    ans_lower = res["answer"].lower()
    assert "india" in ans_lower
    assert "bengaluru" in ans_lower
    # Must NOT claim Bengaluru is the only city covered by the platform
    assert "only city covered by cityflow" not in ans_lower
    assert "we only operate in bengaluru" not in ans_lower

