from odoo import api, fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    is_zipcode_required = fields.Boolean(string="Is Zipcode Required")
