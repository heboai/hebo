from rest_framework import serializers

from knowledge.models import Page


class PageSerializer(serializers.ModelSerializer):
    """Serializer for the Page model."""

    class Meta:
        model = Page
        fields = ["title", "content", "created_at", "updated_at"]

    def validate(self, data):
        """Validate the page data."""
        # Ensure content is not empty
        if not data.get("content", "").strip():
            raise serializers.ValidationError("Content cannot be empty")

        return data


class BulkPageSerializer(serializers.Serializer):
    """Serializer for bulk page operations."""

    title = serializers.CharField(max_length=255)
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
