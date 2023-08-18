from odoo import api, fields, models


class OrderZipcode(models.Model):
    _name = "order.zipcode"
    _rec_name = "zip_code"

    zip_code = fields.Char(string="Zip Code")
    state_id = fields.Many2one("res.country.state", string="State", ondelete="restrict")
    country_id = fields.Many2one("res.country", string="Country", ondelete="restrict")
    order_count = fields.Integer(string="Order Count", compute="compute_order_count")
    city = fields.Char(string="City")
    county = fields.Char(string="County")

    @api.onchange("state_id")
    def change_country_id(self):
        for zip_code in self:
            if zip_code.state_id:
                zip_code.country_id = (
                    zip_code.state_id.country_id and zip_code.state_id.country_id.id
                )

    # compute the number of pos orders with a zip code
    def compute_order_count(self):
        for zip_code in self:
            order_count = self.env["pos.order"].search_count(
                [
                    ("zip_code", "=like", zip_code.zip_code + "%"),
                    ("state", "!=", "cancel"),
                ]
            )
            zip_code.order_count = order_count

    # Check if the entered zipcode is valid
    @api.model
    def search_order_zipcode(self, zipcode):
        valid_zip_code = self.search([("zip_code", "=", zipcode[:5])])
        if valid_zip_code:
            return True
        else:
            return False

    @api.constrains("zip_code")
    def check_zip_code(self):
        for zip_code in self:
            if self.search(
                [("zip_code", "=", zip_code.zip_code), ("id", "!=", zip_code.id)]
            ):
                raise Warning(
                    "Warning", "Another record with the same zip code already exists!"
                )

    def test_time(self):
        import logging
        from datetime import datetime
        import time

        i = 0
        try:
            while True:
                logging.error("\n\n\n\n\nwhile start---%s\n\n\n\n" % i)
                logging.error(time.ctime())
                time.sleep(60)
                i += 1
                logging.error(time.ctime())
                logging.error("\n\nwhile end---%s\n\n\n\n" % i)
        except Exception as e:
            logger.error(e)
