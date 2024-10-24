document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    alert(`Logged in with Email: ${email}`);

});
document.getElementById('exercise-date').addEventListener('change', function() {
    const selectedDate = this.value;
    console.log('Selected date:', selectedDate);
});



// JavaScript to handle the date input