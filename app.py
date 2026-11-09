from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)
app.config["SECRET_KEY"] = "your-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///bluerich.db"

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)

@app.route("/signin")
def sign_in():
    return render_template("signin.html")
@app.route("/api/signin", methods=["POST"])
def api_sign_in():
    data = request.get_json(silent=True) or request.form

    email = data.get("email", "").strip()
    password = data.get("password", "")
    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and Password are Required!"
        })

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({
            "success": False,
            "message": "Invalid Email or Password!"
        }), 401

    session.clear()
    session["user_id"] = user.id
    redirects = {
    "admin": "/admin",
    "sales": "/sales_account",
    "manager": "/manager",
    "cashier": "/cashier",
    "kitchen": "/kitchen_account",
    "bakery": "/bakery_account"
}

    return jsonify({
        "success": True,
        "message": "Login Successful!",
        "redirect": redirects.get(user.role, "/signin"),
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    })

@app.route("/api/session")
def api_session():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({
            "authenticated": False
        }), 401

    user = User.query.get(user_id)
    if not user:
        session.clear()
        return jsonify({
            "authenticated": False
        }), 401

    return jsonify({
        "authenticated": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    })

@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({
        "success": True,
        "message": "Logged out successfully!"
    })

@app.route("/signup", methods=["GET"])
@app.route("/api/signup", methods=["POST"])
def sign_up():
    if request.method == "POST":
        print("FLASK SIGNUP ROUTE REACHED")

        data = request.get_json(silent=True) or request.form
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "")
        confirm_pass = data.get("confirm", "")
        role = data.get("role", "")
        print("SUBMITTED ROLE:", repr(role))

        if not name or not email or not password or not confirm_pass or not role:
            return jsonify({
                "success": False,
                "message": "Fields Are Empty!"
            }), 400
        
        if password != confirm_pass:
            return jsonify({
                "success": False,
                "message": "Passwords Don't Match!"
            }), 400
        
        elif User.query.filter_by(email=email).first():
            return jsonify({
                "success": False,
                "message": "Email Already Exists!"
            }), 409
        
        allowed_roles = ["sales", "cashier", "kitchen", "bakery", "manager"]

        if role not in allowed_roles:
            return jsonify({
                "success": False,
                "message": "Invalid Role Selected!"
            }), 400
        hashed_password = generate_password_hash(password)
        new_user = User(
            name = name,
            email = email,
            password_hash = hashed_password,
            role = role
        )

        db.session.add(new_user)
        db.session.commit()

        session.clear()
        session["user_id"] = new_user.id

        redirects = {
            "admin": url_for("admin_dashboard"),
            "manager": url_for("manager_dashboard"),
            "cashier": url_for("cashier_dashboard"),
            "sales": url_for("sales_dashboard"),
            "kitchen": url_for("kitchen_dashboard"),
            "bakery": url_for("bakery_dashboard")
        }

        return jsonify({
            "success": True,
            "message": "Account Created Successfully!",
            "redirect": redirects.get(new_user.role, url_for("sign_in"))
        })
    
    
    return render_template("signup.html")

def login_required(*roles):
    def decorator(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            user_id = session.get("user_id")

            if not user_id:
                return redirect(url_for("sign_in"))

            user = db.session.get(User, user_id)

            if not user:
                session.clear()
                return redirect(url_for("sign_in"))

            if roles and user.role not in roles:
                return render_template("403.html")
            return function(*args, **kwargs)
        
        return wrapper
    return decorator

@app.route("/api/users")
@login_required("admin")
def view_users():
    users = User.query.order_by(User.name).all()

    return jsonify({
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
            for user in users
        ]
    })

@app.route("/api/users/delete", methods=["POST"])
@login_required("admin")
def delete_user():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()

    if not email:
        return jsonify({
            "success": False,
            "message": "Account Email is Required!"
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({
            "success": False,
            "message": "Account not found"
        }), 404

    if user.id == session.get("user_id"):
        return jsonify({
            "success": False,
            "message": "You cannot delete your own account here!"
        }), 403

    db.session.delete(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Account deleted successfully!"
    })

@app.route("/api/account/delete", methods=["POST"])
@login_required("admin")
def delete_my_account():
    data = request.get_json(silent=True) or {}
    password = data.get("password", "")

    if not password:
        return jsonify({
            "success": False,
            "message": "Account password is required!"
        }), 400
    
    admin = db.session.get(User, session.get("user_id"))

    if not check_password_hash(admin.password_hash, password):
        return jsonify({
            "success": False,
            "message": "Incorrect password!"
        }), 401

    db.session.delete(admin)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Your account has been deleted successfully!"
    })

@app.route("/api/admins/create", methods=["POST"])
@login_required("admin")
def create_admin():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    confirm = data.get("confirm", "")
    admin_password = data.get("admin_password", "")

    current_admin = db.session.get(User, session.get("user_id"))

    if not name or not email or not password or not confirm or not admin_password:
        return jsonify({
            "success": False,
            "message": "All Fields are Required!"
        }), 400

    if not check_password_hash(current_admin.password_hash, admin_password):
        return jsonify({
            "success": False,
            "message": "Incorrect Admin Password!"
        }), 401


    if password != confirm:
        return jsonify({
            "success": False,
            "message": "Passwords don't match!"
        }), 400

    existing_admin = User.query.filter_by(email=email).first()

    if existing_admin:
        return jsonify({
            "success": False,
            "message": "Email Already Exists!"
        }), 409

    hashed_password = generate_password_hash(password)

    new_admin = User(
        name=name,
        email=email,
        password_hash=hashed_password,
        role="admin"
    )
    
    db.session.add(new_admin)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Admin account created successfuly!"
    }), 201


@app.route("/admin")
@login_required("admin")
def admin_dashboard():
    return render_template("admin.html")

@app.route("/manager")
@login_required("manager")
def manager_dashboard():
    return render_template("manager.html")

@app.route("/cashier")
@login_required("cashier")
def cashier_dashboard():
    return render_template("cashier.html")

@app.route("/sales_account")
@login_required("sales")
def sales_dashboard():
    return render_template("sales.html")

@app.route("/kitchen_account")
@login_required("kitchen")
def kitchen_dashboard():
    return render_template("kitchen.html")

@app.route("/bakery_account")
@login_required("bakery")
def bakery_dashboard():
    return render_template("bakery.html")


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
