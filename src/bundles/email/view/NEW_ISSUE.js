const path = require('path');

const header = require(path.resolve('src/view/header.email'));
const layout = require(path.resolve('src/view/simple.layout.email'));
const footer = require(path.resolve('src/view/footer.email'));

const shortenString = (str, len = 60) => (str.length > len ? str.substring(0, len - 3) + '...' : str)

module.exports = {
  subject: 'New Ticket Submitted',
  build({ code, issue, category, ...args }) {
      return layout(
            header({title: 'New Ticket Submitted!', description: 'You\'ve received a new ticket from a customer.'}) + `
            <tr class="body sign-up">
                <td>
                    <table class="table1" width="600" align="center" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td bgcolor="#fcfcfc" style="padding: 20px 20px;border: 1px solid #f2f2f2;border-radius: 5px;">
                                <h3>A customer submitted new ticket.</h3>

                                <p>
                                  <span class="title-color">Name</span> <br>
                                  ${issue.name}
                                </p>
                                <p>
                                    <span class="title-color">Phone</span> <br>
                                    ${issue.phone}
                                </p>
                                <p>
                                    <span class="title-color">Email Address</span> <br>
                                    ${issue.email || '-'}
                                </p>
                                <p>
                                    <span class="title-color">Urgency</span> <br>
                                    ${issue.urgency}
                                </p>
                                <p>
                                    <span class="title-color">Topic</span> <br>
                                    ${category.name}
                                </p>
                                <p>
                                    <span class="title-color">Message</span> <br>
                                    ${shortenString(issue.message)}
                                </p>
                                <p>
                                    Cheers, <br>  
                                    Jiteng Corporation!
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        ` + footer(), args);
  },
};
