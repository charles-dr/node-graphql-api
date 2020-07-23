const path = require('path');

const { cdn } = require(path.resolve('config'));

module.exports = (args) => `
<!-- horizontal gap -->
<tr><td height="40"></td></tr>

<!-- footer -->
<tr>
    <td>
        <table class="table1" width="600" align="center" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" mc:edit="text105" class="text_color_767676" style="line-height: 1;color: #767676; font-size: 14px; font-weight: 400; font-family: 'Open Sans', Helvetica, sans-serif; mso-line-height-rule: exactly;">
                    <div class="editable-text">
                        <span class="text_container">&copy; All Rights Reserved. 2020. info@shoclef.com</span>
                    </div>
                </td>
            </tr>
            <!-- horizontal gap -->
            <tr><td height="15"></td></tr>

            <tr>
                <td align="center" mc:edit="text106" class="text_color_767676" style="line-height: 1;color: #767676; font-size: 14px; font-weight: 400; font-family: 'Open Sans', Helvetica, sans-serif; mso-line-height-rule: exactly;">
                    <div class="editable-text">
                        <span class="text_container">You are receiving this email because you have signed up with Shoclef app or website.</span>
                        <a href="https://airtable.com/shrjisooStGxLgKJy" class="text_color_767676" style="line-height: 1;color: #767676; font-size: 14px; font-weight: 400; font-family: 'Open Sans', Helvetica, sans-serif; mso-line-height-rule: exactly;"><br><br>Unsubscribe</a>
                    </div>
                </td>
            </tr>
        </table>
    </td>
</tr><!-- END footer -->
<!-- padding-bottom -->
<tr><td height="100"></td></tr>
`;
