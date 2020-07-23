/* eslint-disable no-unused-expressions */
const path = require('path');

const { email } = require(path.resolve('config'));

const header = require(path.resolve('src/view/header.email'));
const layout = require(path.resolve('src/view/simple.layout.email'));
const footer = require(path.resolve('src/view/footer.email'));

function makeInvoicePdfList(orderItems, pdf) {
  let listString = '';
  orderItems
    ? orderItems.map((item) => {
      const url = item.productAttribute ? (item.productAttribute.asset ? item.productAttribute.asset.url : '') : (item.product.assets.length ? item.product.assets[0].url : '');
      // const url = item.productAttribute ? (item.productAttribute.asset ? item.productAttribute.asset.url : item.product.assets[0].url) : item.product.assets[0].url;
      const price = item.productAttribute ? item.productAttribute.price : item.product.price;
      const id = item.productAttribute ? item.productAttribute.id : item.product.id;
      const sku = item.productAttribute ? item.productAttribute.sku : item.product.sku;
      listString += `<!-- row-1 -->
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
                                                        <span class="text_container">QTY: ${item.quantity}</span>
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
                                                            <a href="${pdf}" class="text_color_ffffff" style="text-decoration: none; color: #ffffff;">Invoice</a>
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
    : listString = '';
  return listString;
}
module.exports = {
  subject: 'Thank you for your purchase!',
  build({ code, ...args }) {
    const { data } = args;
    return layout(
      `${header({ title: '', description: '' })}
      <!-- body -->
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
                                            <span class="text_container">Thank You For Purchasing</span>
                                        </div>
                                    </td>
                                </tr><!-- END email heading -->
    
                                <!-- horizontal gap -->
                                <tr><td height="20"></td></tr>
    
                                <!-- email details -->
                                <tr>
                                    <td align="left" mc:edit="text102" class="text_color_767676 center_content" style="line-height: 1.8;color: #767676; font-size: 14px; font-weight: 400; font-family: 'Open Sans', Helvetica, sans-serif; mso-line-height-rule: exactly;">
                                        <div class="editable-text">
                                            <span class="text_container">Your Order Number for your purchase on <b>${data.createdAt}</b> is <u><b>${data.orderId}</b></u></span><br><br>
                                            <span class="text_container">SHIPPING DETAILS</span><br>
                                            <span class="text_container">As soon as your item ships, we will send you a shipping confirmation email. You can also track the status of your items on the Shoclef mobile app, under <i>"Orders"</i> in the Buyer Dashboard.</span>
                                        </div>
                                    </td>
                                </tr><!-- END email details -->
    
                                <!-- horizontal gap -->
                                <tr><td height="40"></td></tr>
                                ${makeInvoicePdfList(data.orderItems, data.invoicePdf)}                            </table><!-- END body-container -->
                        </td>
                    </tr>
                </table>
            </td>
        </tr><!-- END body -->
        ${footer()}`, args,
        );
  },
};
