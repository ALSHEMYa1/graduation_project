import traceback

from fastapi import HTTPException

from services.ai_engine import (
    summarize_text,
    generate_test,
    generate_flashcards,
    generate_study_plan,
    generate_mind_map,
    chat_with_ai,
    analyze_knowledge_gaps,
)


def call_ai(endpoint: str, data: dict):
    """Call the AI engine directly (no separate AI service).

    Preserves the exact response shapes the AI service previously exposed
    so existing backend routes and the frontend keep working unchanged.
    """
    try:
        if endpoint == "summarize":
            result = summarize_text(
                data.get("text", ""),
                data.get("language", "ar"),
                data.get("detail_level", "short"),
            )
            return {"summary": result}

        if endpoint == "generate-comprehensive-test":
            return generate_test(
                data.get("text", ""),
                data.get("language", "ar"),
                data.get("subject_title", "Study Material"),
                int(data.get("num_questions", 5)),
            )

        if endpoint == "generate-flashcards":
            return generate_flashcards(
                data.get("text", ""),
                data.get("language", "ar"),
                data.get("subject_title", "Study Material"),
                int(data.get("num_cards", 20)),
            )

        if endpoint == "generate-study-plan":
            result = generate_study_plan(
                data.get("text", ""),
                int(data.get("days", 7)),
                data.get("language", "ar"),
                data.get("subject_title", "Study Material"),
            )
            return {
                "plan": result.get("days", []),
                "meta": result.get("plan_metadata", {}),
            }

        if endpoint == "generate-mind-map":
            return generate_mind_map(
                data.get("text", ""),
                data.get("language", "ar"),
                data.get("subject_title", "Study Material"),
            )

        if endpoint == "chat":
            response = chat_with_ai(
                data.get("user_message", ""),
                data.get("conversation_history", []),
                data.get("document_text", ""),
                data.get("language", "en"),
            )
            return {"response": response}

        if endpoint == "analyze-knowledge-gaps":
            return analyze_knowledge_gaps(
                data.get("text", ""),
                data.get("language", "en"),
                data.get("subject_title", "Study Material"),
            )

        raise HTTPException(status_code=404, detail=f"Unknown AI endpoint: {endpoint}")
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI engine error: {str(e)}")
