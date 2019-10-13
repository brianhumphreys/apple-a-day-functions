const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true;
    else return false;
}

const isEmpty = (userFormInput) => {
    if(userFormInput.trim() === '') return true;
    else return false;
}

const isPasswordLengthSufficient = (password) => {
    if(password.length < 8) return false;
    else return true;
}

exports.validateSignupData = (data) => {
    errors = {};

    if(isEmpty(data.email)) {
        errors.email = 'Must not be empty'
    } else if(!isEmail(data.email)){
        errors.email = 'Must be a valid email address'
    }

    if(!isPasswordLengthSufficient(data.password)) errors.password = 'Must contain 8 or more characters';
    if(data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords must match';
    if(isEmpty(data.handle)) errors.handle = 'Must not be empty';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };
}

exports.validateLoginData = (data) => {
    let errors = {};

    if(isEmpty(data.email)) {
        errors.email = 'Must not be empty'
    } else if(!isEmail(data.email)){
        errors.email = 'Must be a valid email address'
    }

    if(isEmpty(data.password)) errors.password = 'Must not be empty';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.reduceUserDetails = (data) => {
    let userDetails = {};

    if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if(!isEmpty(data.website.trim())) {
        if(data.website.trim().substring(0,4) !== 'http') {
            userDetails.website = `http://${data.website.trim()}`;
        } else userDetails.website = data.website;
    }
    if(!isEmpty(data.location.trim())) userDetails.location = data.location;

    return userDetails;
}
