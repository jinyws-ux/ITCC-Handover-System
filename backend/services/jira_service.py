from __future__ import annotations


def fetch_issue(issue_key: str) -> dict:
    """Placeholder for future Jira API integration.

    MVP stores Jira external links manually. Later this function can call Jira
    by issue key and return normalized metadata.
    """
    return {
        "external_type": "Jira",
        "external_id": issue_key,
        "external_title": "",
        "external_url": "",
        "external_status": "",
    }
