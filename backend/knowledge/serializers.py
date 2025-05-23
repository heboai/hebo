from rest_framework import serializers

from knowledge.models import Page


class PageSerializer(serializers.ModelSerializer):
    """Serializer for the Page model."""

    class Meta:
        model = Page
        fields = ["title", "content", "created_at", "updated_at"]

    def validate(self, data):
        """Validate the page data."""
        # Ensure title & content are not empty/whitespace
        if not data.get("title", "").strip():
            raise serializers.ValidationError({"title": "Title cannot be empty"})
        if not data.get("content", "").strip():
            raise serializers.ValidationError({"content": "Content cannot be empty"})
        return data


class BulkPageSerializer(serializers.Serializer):
    """Serializer for bulk page operations."""

    title = serializers.CharField(max_length=200)
    content = serializers.CharField()

    def validate_title(self, value):
        """Validate the title."""
        if not value.strip():
            raise serializers.ValidationError("Title cannot be empty")
        return value

    def validate_content(self, value):
        """Validate the content."""
        if not value.strip():
            raise serializers.ValidationError("Content cannot be empty")
        return value
