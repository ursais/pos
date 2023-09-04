/* eslint-disable */
odoo.define("pos_order_zip.EnterZipCode", function (require) {
    "use strict";

    const PosComponent = require("point_of_sale.PosComponent");
    const ProductScreen = require("point_of_sale.ProductScreen");
    const Registries = require("point_of_sale.Registries");
    const {useListener} = require("@web/core/utils/hooks");
    var rpc = require("web.rpc");

    class EnterZipCodeButton extends PosComponent {
        setup() {
            super.setup();
            useListener("click", this.onClick);
        }
        get_zip_code(value) {
            const selectedOrder = this.env.pos.get_order();
            var zip_code = value.trim();
            var self = this;
            if (zip_code) {
                rpc.query({
                    model: "order.zipcode",
                    method: "search_order_zipcode",
                    args: [zip_code],
                }).then(
                    function (result) {
                        if (result) {
                            //                            var selectedOrder = self.pos.get_order();
                            selectedOrder.zip_code = zip_code;
                            selectedOrder.trigger("change", selectedOrder);
                        } else {
                            if (zip_code.length > 10) {
                                self.showPopup("ErrorPopup", {
                                    title: self.env._t("Zip Code Is Invalid !"),
                                    body: self.env._t("Zip Must Be Nine Digit."),
                                });
                            } else {
                                self.showPopup("ConfirmPopup", {
                                    title: self.env._t("Zipcode Not Verified!"),
                                    body: self.env._t(
                                        "Are You Sure You Want To Set This Zip Code?"
                                    ),
                                    confirm: function () {
                                        var selectedOrder = self.pos.get_order();
                                        selectedOrder.zip_code = zip_code;
                                        selectedOrder.trigger("change", selectedOrder);
                                    },
                                });
                            }
                        }
                    },
                    function (type, err) {
                        self.showPopup("confirm", {
                            title: _t("Network Problem:"),
                            body: _t(
                                "Your Internet Connection Is Probably Down. Zip Code Not Verfied. Are You Sure You Want To Set This Zip Code?"
                            ),
                            confirm: function () {
                                var selectedOrder = self.pos.get_order();
                                selectedOrder.zip_code = zip_code;
                                selectedOrder.trigger("change", selectedOrder);
                            },
                        });
                    }
                );
            } else {
                self.pos.get_order().zip_code = "";
            }
        }
        async onClick() {
            const {confirmed, payload: code} = await this.showPopup("TextInputPopup", {
                title: this.env._t("Enter Zip Code 123!"),
                startingValue: "",
            });
            if (confirmed) {
                this.get_zip_code(code);
            }
            return false;
        }
    }

    EnterZipCodeButton.template = "EnterZipCodeButton";
    ProductScreen.addControlButton({
        component: EnterZipCodeButton,
    });
    Registries.Component.add(EnterZipCodeButton);
    return EnterZipCodeButton;
});
