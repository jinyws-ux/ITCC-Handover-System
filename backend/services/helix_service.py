from __future__ import annotations


def fetch_ticket(ticket_no: str) -> dict:
    """Placeholder for future Helix API integration.

    MVP stores Helix external links manually. Later this function can call the
    Helix API by ticket number and return normalized metadata.
    """
    return {
        "external_type": "Helix",
        "external_id": ticket_no,
        "external_title": "",
        "external_url": "",
        "external_status": "",
    }
