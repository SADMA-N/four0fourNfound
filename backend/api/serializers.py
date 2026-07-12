from rest_framework import serializers

from .models import AnnotatedImage, AnnotationPolygon, Task


class TaskSerializer(serializers.ModelSerializer):
    dueDate = serializers.DateField(source="due_date", format="%Y-%m-%d")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "status",
            "priority",
            "dueDate",
            "position",
            "tags",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["position"]

    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list.")
        cleaned = []
        for tag in value:
            t = str(tag).strip()
            if t and t not in cleaned:
                cleaned.append(t[:32])
        return cleaned[:8]


class PolygonSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = AnnotationPolygon
        fields = ["id", "points", "color", "label", "createdAt"]

    def validate_points(self, value):
        if not isinstance(value, list) or len(value) < 3:
            raise serializers.ValidationError("A polygon needs at least three normalized points.")
        cleaned = []
        for point in value:
            if not isinstance(point, dict):
                raise serializers.ValidationError("Each point must be an object with x and y.")
            try:
                x = float(point["x"])
                y = float(point["y"])
            except (KeyError, TypeError, ValueError):
                raise serializers.ValidationError("Each point must have numeric x and y fields.")
            if not 0 <= x <= 1 or not 0 <= y <= 1:
                raise serializers.ValidationError("Points must be normalized between 0 and 1.")
            cleaned.append({"x": round(x, 6), "y": round(y, 6)})
        return cleaned


class AnnotatedImageSerializer(serializers.ModelSerializer):
    polygons = PolygonSerializer(many=True, read_only=True)
    originalName = serializers.CharField(source="original_name", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = AnnotatedImage
        fields = ["id", "url", "originalName", "createdAt", "polygons"]

    def get_url(self, obj):
        request = self.context.get("request")
        url = obj.image.url if obj.image else ""
        if request and url:
            return request.build_absolute_uri(url)
        return url
