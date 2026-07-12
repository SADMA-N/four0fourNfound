from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.HealthView.as_view(), name="health"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/signup/", views.SignupView.as_view(), name="signup"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("tasks/", views.TaskCollectionView.as_view(), name="tasks"),
    path("tasks/reorder/", views.TaskReorderView.as_view(), name="task-reorder"),
    path("tasks/<int:task_id>/", views.TaskDetailView.as_view(), name="task-detail"),
    path("images/", views.ImageCollectionView.as_view(), name="images"),
    path("images/<int:image_id>/", views.ImageDetailView.as_view(), name="image-detail"),
    path("images/<int:image_id>/polygons/", views.PolygonCollectionView.as_view(), name="image-polygons"),
    path("polygons/<int:polygon_id>/", views.PolygonDetailView.as_view(), name="polygon-detail"),
]



#In Django, each app has its own  urls.py  module containing a list called  urlpatterns 
