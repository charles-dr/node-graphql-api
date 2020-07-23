const path = require('path');

const { cdn } = require(path.resolve('config'));

module.exports = (args) => `
    <tr>
        <td>
            <table class="table1" width="600" align="center" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td bgcolor="#fcfcfc" style="padding-top: 30px;padding-right: 40px;padding-bottom: 0;padding-left: 40px; border: 1px solid #f2f2f2; border-radius: 5px;">
                        <!-- Logo -->
                        <table class="no_float" align="left" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td class="editable-img" align="center">
                                    <a href="#">
                                        <img editable="true" class="centerize" mc:edit="image101" src="${cdn.appAssets}/images/shoclef-web-logo-email.png" style="display:block; line-height:0; height: 40px; font-size:0; border:0;" border="0" alt="image" />
                                    </a>
                                </td>
                            </tr>
                            <!-- margin-bottom -->
                            <tr><td height="30"></td></tr>
                        </table><!-- END logo -->

                        <!-- social icons -->
                        <table class="no_float" width="135" align="right" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td>
                                    <table width="100" align="center" border="0" cellspacing="0" cellpadding="0" style="max-width: 135px;">
                                        <tr>
                                            <td class="editable-img" align="center">
                                                <a href="https://twitter.com/shoclef">
                                                    <img editable="true" class="centerize" mc:edit="image102" src="${cdn.appAssets}/images/social-icon-twitter.png" style="display:block; line-height:0; font-size:0; border:0;" border="0" alt="image" />
                                                </a>
                                            </td>
                                            <td class="editable-img" align="right">
                                                <a href="https://www.facebook.com/shoclef">
                                                    <img editable="true" class="centerize" mc:edit="image104" src="${cdn.appAssets}/images/social-icon-fb.png" style="display:block; line-height:0; font-size:0; border:0;" border="0" alt="image" />
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <!-- margin-bottom -->
                            <tr><td height="30"></td></tr>
                        </table><!-- END social icons -->
                    </td>
                </tr>
            </table>
        </td>
    </tr><!-- END header -->
    <!-- horizontal gap -->
	<tr><td height="25"></td></tr>
`;
