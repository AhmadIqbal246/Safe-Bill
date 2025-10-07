from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0020_add_missing_role_flags"),
    ]

    operations = [
        # Drop legacy column if present to avoid NOT NULL insert failures
        migrations.RunSQL(
            sql=(
                "ALTER TABLE accounts_user "
                "DROP COLUMN IF EXISTS available_roles;"
            ),
            reverse_sql=(
                "ALTER TABLE accounts_user "
                "ADD COLUMN IF NOT EXISTS available_roles jsonb NOT NULL DEFAULT '[]';"
            ),
        ),
    ]


