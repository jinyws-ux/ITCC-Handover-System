from __future__ import annotations


def parse_mail_link(mail_url: str) -> dict:
    """Placeholder for future Outlook or Microsoft Graph integration.

    MVP stores Outlook mail links manually. Later this function can extract or
    fetch mail metadata if company permissions allow it.
    """
    return {
        "external_type": "Outlook",
        "external_id": "",
        "external_title": "",
        "external_url": mail_url,
        "external_status": "Linked",
    }
