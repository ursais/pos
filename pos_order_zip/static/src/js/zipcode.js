odoo.define("pos_order_zip.enter_zipcode", function (require) {
    "use strict";

    const PosComponent = require("point_of_sale.PosComponent");
    const ProductScreen = require("point_of_sale.ProductScreen");
    const Registries = require("point_of_sale.Registries");

    class EnterZipCodeButton extends PosComponent {
        async onClick() {
            var self = this;
            console.log("\n\n=========self.pos===========", this, self, self.pos);
            this.showPopup("TextInputPopup", {
                title: "Enter Zip Code !",
                confirm: self.get_zip_code,
                //                'value': self.pos.get_order().zip_code,
            });
        }
        get_zip_code(value) {
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
                            var selectedOrder = self.pos.get_order();
                            selectedOrder.zip_code = zip_code;
                            //                            SelectedOrder.trigger('change');
                        } else if (zip_code.length > 10) {
                                self.showPopup("error", {
                                    title: _t("Zip Code Is Invalid !"),
                                    body: _t("Zip Must Be Nine Digit."),
                                });
                            } else {
                                self.showPopup("confirm", {
                                    title: _t("Zipcode Not Verified!"),
                                    body: _t(
                                        "Are You Sure You Want To Set This Zip Code?"
                                    ),
                                    confirm: function () {
                                        var selectedOrder = self.pos.get_order();
                                        selectedOrder.zip_code = zip_code;
                                        selectedOrder.trigger("change", selectedOrder);
                                    },
                                });
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
    }
    EnterZipCodeButton.template = "EnterZipCodeButton";
    ProductScreen.addControlButton({
        component: EnterZipCodeButton,
    });
    Registries.Component.add(EnterZipCodeButton);
    return EnterZipCodeButton;
});
