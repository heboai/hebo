# Generated by Django 5.1.4 on 2025-02-28 05:37

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("versions", "0002_agentslug_and_more"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="versionslug",
            constraint=models.UniqueConstraint(
                fields=("version", "slug"), name="unique_version_slug_per_organization"
            ),
        ),
    ]
