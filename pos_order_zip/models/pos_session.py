# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models


class PosSession(models.Model):
    _inherit = 'pos.session'

    def _pos_data_process(self, loaded_data):
        super()._pos_data_process(loaded_data)
        if self.config_id.is_zipcode_required:
            loaded_data['zip_code'] = {orderzip['zip_code']: orderzip for orderzip in loaded_data['order.zipcode']}

    def _pos_ui_models_to_load(self):
        result = super()._pos_ui_models_to_load()
        if self.config_id.is_zipcode_required:
            new_model = 'order.zipcode'
            if new_model not in result:
                result.append(new_model)
        return result

    def _loader_params_order_zipcode(self):
        return {'search_params': {'domain': [], 'fields': ['zip_code', 'id'], 'load': False}}

    def _get_pos_ui_order_zipcode(self, params):
        return self.env['order.zipcode'].search_read(**params['search_params'])

    # def _get_pos_ui_order_zipcode(self, params):
    #     employees = self.env['order.zipcode'].search_read(**params['search_params'])
    #     employee_ids = [employee['id'] for employee in employees]
    #     user_ids = [employee['user_id'] for employee in employees if employee['user_id']]
    #     manager_ids = self.env['res.users'].browse(user_ids).filtered(lambda user: self.config_id.group_pos_manager_id in user.groups_id).mapped('id')
    #     employees_barcode_pin = self.env['order.zipcode'].browse(employee_ids).get_barcodes_and_pin_hashed()
    #     bp_per_employee_id = {bp_e['id']: bp_e for bp_e in employees_barcode_pin}
    #     for employee in employees:
    #         employee['role'] = 'manager' if employee['user_id'] and employee['user_id'] in manager_ids else 'cashier'
    #         employee['barcode'] = bp_per_employee_id[employee['id']]['barcode']
    #         employee['pin'] = bp_per_employee_id[employee['id']]['pin']
    #     return employees
