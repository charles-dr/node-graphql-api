const path = require('path');

const { email } = require(path.resolve('config'));

const header = require(path.resolve('src/view/header.email'));
const layout = require(path.resolve('src/view/simple.layout.email'));
const footer = require(path.resolve('src/view/footer.email'));

module.exports = {
  subject: 'Reset password',
  build({ code, ...args }) {
    return layout(
      `${header({ title: 'Notice!', description: 'You told us you forgot your password.' })}
        <tr class="body reset-password">
            <td>
                <table class="table1" width="600" align="center" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td bgcolor="#fcfcfc" style="padding: 20px 20px;border: 1px solid #f2f2f2;border-radius: 5px;">
                            <p class="title-color">
                                Hi${args.user.name ? ` ${args.user.name}` : ''},
                            </p>
                            <p>
                                We received a request to reset your password for your Shoclef account: 
                                <a class="link link-default" href="#">${args.user.email}</a>. We’re here to help!
                            </p>
                            <p>
                                Simply use this code to set a new password:
                            </p>
                            <p class="reset-action">
                                <b>${code}</b>
                            </p>
                            <p>
                                If you didn’t ask to change your password, 
                                <a class="link" href="mailto:${email.supportEmail}">contact our support</a>! 
                                Don’t worry, your password is still safe and you can delete this email.
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
    ${footer()}`, args,
    );
  },
};
