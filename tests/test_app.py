from copy import deepcopy
from urllib.parse import quote

from fastapi.testclient import TestClient

from src.app import app, activities

# Keep an original snapshot to restore between tests
_ORIGINAL_ACTIVITIES = deepcopy(activities)
client = TestClient(app)


def setup_function():
    # Arrange: reset global activities before each test
    activities.clear()
    activities.update(deepcopy(_ORIGINAL_ACTIVITIES))


def test_get_activities_returns_all_activities():
    # Arrange (handled by setup_function)

    # Act
    resp = client.get("/activities")

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_for_activity_adds_participant():
    # Arrange
    activity = "Chess Club"
    email = "new_student@mergington.edu"

    # Act
    resp = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})

    # Assert
    assert resp.status_code == 200
    assert resp.json() == {"message": f"Signed up {email} for {activity}"}
    assert email in activities[activity]["participants"]


def test_signup_duplicate_returns_400():
    # Arrange
    activity = "Chess Club"
    existing = activities[activity]["participants"][0]

    # Act
    resp = client.post(f"/activities/{quote(activity)}/signup", params={"email": existing})

    # Assert
    assert resp.status_code == 400


def test_unregister_from_activity_removes_participant():
    # Arrange
    activity = "Chess Club"
    email = activities[activity]["participants"][0]

    # Act
    resp = client.delete(f"/activities/{quote(activity)}/signup", params={"email": email})

    # Assert
    assert resp.status_code == 200
    assert resp.json() == {"message": f"Unregistered {email} from {activity}"}
    assert email not in activities[activity]["participants"]


def test_unregister_missing_participant_returns_404():
    # Arrange
    activity = "Chess Club"
    email = "missing@mergington.edu"

    # Act
    resp = client.delete(f"/activities/{quote(activity)}/signup", params={"email": email})

    # Assert
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Participant not found"
