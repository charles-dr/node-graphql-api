const path = require('path');

const { email } = require(path.resolve('config'));

const header = require(path.resolve('src/view/header.email'));
const layout = require(path.resolve('src/view/simple.layout.email'));
const footer = require(path.resolve('src/view/footer.email'));

module.exports = {
  subject: 'Password has been changed',
  build({ code, ...args }) {
    return layout(
        header({title: 'Update!', description: 'Your password has been changed.'}) + `
        <tr class="body password-changed">
            <td>
                <table class="table1" width="600" align="center" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td bgcolor="#fcfcfc" style="padding: 20px 20px;border: 1px solid #f2f2f2;border-radius: 5px;">
                            <p class="title-color">
                                Hi${args.user.name ?  ' ' + args.user.name: ''},
                            </p>
                            <p>
                                The password for the Shoclef account <a class="link link-default" href="#">${args.user.email}</a> was just changed.
                            </p>
                            <p>
                                If this was you, then you can safely ignore this email.
                            </p>
                            <p>
                                If this wasn’t you, 
                                <a class="link" href="mailto:${email.supportEmail}">contact our support</a>.
                            </p>
                            <p>
                                Cheers, <br>  
                                Shoclef Corporation!
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    ` + footer(), args);
  },
};
