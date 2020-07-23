const path = require('path');

const { email } = require(path.resolve('config'));

const header = require(path.resolve('src/view/header.email'));
const layout = require(path.resolve('src/view/simple.layout.email'));
const footer = require(path.resolve('src/view/footer.email'));

function makeInvoicePdfList(orderItems, pdf) {
    let listString = '';
    orderItems
    ? orderItems.map(item => {
        const url = item.productAttribute ? item.productAttribute.asset.url : item.product.assets[0].url;
        const price = item.productAttribute ? item.productAttribute.price : item.product.price;
        const id = item.productAttribute ? item.productAttribute.id : item.product.id;
        const sku = item.productAttribute ? item.productAttribute.sku : item.product.sku;
        listString = listString + `<!-- row-1 -->
        <tr>
            <td bgcolor="#ffffff" style="padding: 0 20px;border: 1px solid #ebebeb;border-radius: 5px;">
                <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td>
                            <!-- column-1 -->
                            <table width="80" class="table1-3" align="left" border="0" cellpadding="0" cellspacing="0">
                                <!-- margin-top -->
                                <tr><td height="20"></td></tr>
                                <tr>
                                    <td>
                                        <table width="80" height="60" align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 80px;">																
                                            <tr>
                                                <td align="center" valign="middle" bgcolor="#fcfcfc" style="border: 1px solid #ebebeb;border-radius: 5px;" class="editable-img">
                                                    <a href="#">
                                                        <img editable="true" mc:edit="image105" src="${url}" style="display:block; line-height:0; font-size:0; border:0;max-width: 100%;" border="0" alt="image" />
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- margin-bottom -->
                                <tr class="tablet_hide"><td height="20"></td></tr>
                            </table><!-- ENd column-1 -->
                            
                            <!-- vertical gutter -->
                            <table class="table1-3" width="20" align="left" border="0" cellpadding="0" cellspacing="0">
                                <tr><td height="1"></td></tr>
                            </table>

                            <!-- column-2 -->
                            <table width="230" class="table1-3" align="left" border="0" cellpadding="0" cellspacing="0">
                                <!-- margin-top -->
                                <tr><td height="25"></td></tr>
                                <tr>
                                    <td>
                                        <table width="230" align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 230px;">																
                                            <tr>
                                                <td align="left" mc:edit="text103" class="text_color_282828 center_content" style="line-height: 1;color: #282828;font-size: 14px; font-weight: 600; font-family: 'Open Sans', Helvetica, sans-serif; mso-line-height-rule: exactly;">
                                                    <div class="editable-text">
                                                        <span class="text_container">${item.product.title}</span>
                                                    </div>
                                                </td>
                                            </tr>

                                            <!-- horizontal gap -->
                                            <tr><td height="10"></td></tr>

                                            <tr>
                                                <td align="left" mc:edit="text104" class="text_color_767676 center_content" style="line-height: 1;color: #767676;font-size: 12px; font-weight: 400; font-family: 'Open Sans', Helvetica, sans-serif; mso-line-height-rule: exactly;">
                                                    <div class="editable-text">
                                                        <span class="text_container">PRICE: ${price.amount} ${price.currency}</span><br>
                                                        <span class="text_container">QTY: ${item.quantity}</span><br>
                                                        <span class="text_container">SKU: - ${sku}</span><br>
                                                        <span class="text_container">PRODUCT ID: ${id}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- margin-bottom -->
                                <tr class="tablet_hide"><td height="20"></td></tr>
                            </table><!-- ENd column-2 -->

                            <!-- vertical gutter -->
                            <table class="table1-3" width="20" align="left" border="0" cellpadding="0" cellspacing="0">
                                <tr><td height="1"></td></tr>
                            </table>

                            <!-- column-3 -->
                            <table width="130" height="60" class="table1-3" align="right" border="0" cellpadding="0" cellspacing="0">
                                <!-- margin-top -->
                                <tr><td height="25"></td></tr>
                                <tr>
                                    <td valign="middle">
                                        <table class="button_bg_color_00838F" bgcolor="#00838F" width="100" height="35" align="center" border="0" cellpadding="0" cellspacing="0" style="border-radius:5px; border-collapse: separate">
                                            <tr>
                                                <td mc:edit="text105" align="center" valign="middle" style="font-size: 14px; font-weight: 400; font-family: 'Open Sans', Helvetica, sans-serif; mso-line-height-rule: exactly;">
                                                    <div class="editable-text">
                                                        <span class="text_container">
                                                            <a href="${pdf}" class="text_color_ffffff" style="text-decoration: none; color: #ffffff;">Packing Slip</a>
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- margin-bottom -->
                                <tr><td height="20"></td></tr>
                            </table><!-- ENd column-3 -->
                        </td>
                    </tr>
                </table>
            </td>
        </tr><!-- END row-1 -->
        <!-- horizontal gap -->
        <tr><td height="25"></td></tr>`;
    })
    : listString = ''
    return listString;
}
module.exports = {
  subject: 'Your product was sold!',
  build({ code, ...args }) {
    const data = args.data;
    return layout(
        header({title: '', description: ''}) + 
        `<!-- body -->
        <tr>
            <td>
                <table class="table1" width="600" align="center" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td bgcolor="#fcfcfc" style="padding: 40px 0;border: 1px solid #f2f2f2;border-radius: 5px;">
                            <!-- body-container -->
                            <table class="table1" width="520" align="center" border="0" cellspacing="0" cellpadding="0">
    
                                <!-- email heading -->
                                <tr>
                                    <td align="left" mc:edit="text101" class="text_color_282828 center_content" style="line-height: 1;color: #282828; font-size: 18px; font-weight: 600; font-family: 'Open Sans', Helvetica, sans-serif; mso-line-height-rule: exactly;">
                                        <div class="editable-text">
                                            <span class="text_container">Your Item(s) been sold</span>
                                        </div>
                                    </td>
                                </tr><!-- END email heading -->
    
                                <!-- horizontal gap -->
                                <tr><td height="20"></td></tr>
    
                                <!-- email details -->
                                <tr>
                                    <td align="left" mc:edit="text102" class="text_color_767676 center_content" style="line-height: 1.8;color: #767676; font-size: 14px; font-weight: 400; font-family: 'Open Sans', Helvetica, sans-serif; mso-line-height-rule: exactly;">
                                        <div class="editable-text">
                                            <span class="text_container">Your Sale Order Number on <b>${data.createdAt}</b> is <u><b>${data.orderId}</b></u></span><br><br>
                                            <span class="text_container">NEXT STEPS FOR FULFILLMENT</span><br>
                                            <span class="text_container">Please prepare the item(s) as listed in the packing slip to be shipped. You will need to go to your indicated courier to drop off the shipment.
                                            Once you receive a tracking number and the hard-copy receipt as proof of shipment, please uplaod the tracking number, estimated delivery date, and the receipt as proof of purchase on the Shoclef mobile app.
                                            Just go under <i>"Manage Products"</i> in Seller Dashboard to upload all details pertaining to this order. Failure to upload in a timely fashion will result in a delayed payout, or withholding on payout.</span>
                                        </div>
                                    </td>
                                </tr><!-- END email details -->
    
                                <!-- horizontal gap -->
                                <tr><td height="40"></td></tr>` + makeInvoicePdfList(data.orderItems, data.invoicePdf) + `
                            </table><!-- END body-container -->
                        </td>
                    </tr>
                </table>
            </td>
        </tr><!-- END body -->
    ` + footer(), args);
  },
};
