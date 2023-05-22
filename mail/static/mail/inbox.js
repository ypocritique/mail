document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  // Added to enable the email to be convoyed 
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#solo-mail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function view_mail(id){

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);
  
      // ... do something else with email ...
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#solo-mail-view').style.display = 'block';

      // Set the mail
      document.querySelector('#solo-mail-view').innerHTML = ` 
        <b>From: </b> ${email.sender}<br>
        <b>To: </b> ${email.recipients}<br>
        <b>Subject:  </b> ${email.subject}<br>
        <b>Timestamp: </b> ${email.timestamp}
        <hr>
        ${email.body}
        <hr>
        <br>
        `;

      // check if read or not
      if (!email.read) {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })
      } 

      // Check if archived or not
      const knob = document.createElement('button');
      knob.innerHTML = email.archived ? 'Unarchive' : 'Archive';
      knob.className = email.archived ? 'btn btn-warning' : 'btn btn-outline-secondary';
      knob.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: !email.archived
          })
        })
        .then(() => {load_mailbox('inbox')})
      });
      document.querySelector('#solo-mail-view').append(knob);

      // Reply functions
      const reply_btn = document.createElement('button')
      reply_btn.innerHTML = 'Reply';
      reply_btn.className = 'btn btn-dark';
      reply_btn.addEventListener('click', function() {
        compose_email();
        document.querySelector('#compose-recipients').value = email.sender;
        let subject = email.subject;
        if (subject.split('', 1)[0] != "Re"){
          subject = "Re: " + subject;
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `
        On ${email.timestamp}; ${email.sender} wrote :
        ${email.body}
        `;

      });
      document.querySelector('#solo-mail-view').append(reply_btn);
    })
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#solo-mail-view').style.display = 'none';

  // Show the mailbox name
  const mail_name = document.querySelector('#emails-view')
  mail_name.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the emails
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
      // Loop through the emails
      emails.forEach(oneMail => {

        console.log(oneMail);
        
        // Set a 'div' for each mail
        const courier = document.createElement('div');
        courier.className = "container text-center"
        courier.innerHTML = `
        <div class="row">
          <div class="col-sm">${oneMail.sender}</div> 
          <div class="col-sm"><b>${oneMail.subject}</b></div>
          <div class="col-sm">${oneMail.timestamp}</div>
        </div>
        `;
        // background color
        courier.className = oneMail.read ? 'read': 'unread';
        courier.addEventListener('click', function() {
            console.log('This element has been clicked!')
            
            // To view the details of the mail when clicked on!
            view_mail(oneMail.id)
          });
          mail_name.append(courier);
          
    
      });

  })
  
}


function send_email(event) {
  //event.stopPropagation();
  event.preventDefault();

  // Encapsulate the values of the fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
    console.log(recipients, subject, body)

  // Send the values to the backend through the API route
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients:  recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    // Show the success message
    console.log(result);
  });
  // Return to the Sent mailbox
  load_mailbox('sent');
  
}