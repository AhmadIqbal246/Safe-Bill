# Generated migration to fix platform_invoice_reference unique constraint
# Change from global unique to per-user unique (enforced in model.save())

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0022_quote_platform_invoice_reference'),
    ]

    operations = [
        # Remove the global unique constraint
        migrations.AlterField(
            model_name='quote',
            name='platform_invoice_reference',
            field=models.CharField(
                blank=True,
                editable=False,
                help_text='Permanent platform invoice reference number (auto-generated, non-editable)',
                max_length=20,
                null=True,
                unique=False  # Changed from unique=True to unique=False
            ),
        ),
    ]
