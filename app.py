from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
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

@app.route("/signup")
def sign_up():
    return render_template("signup.html")

@app.route("/admin")
def admin_dashboard():
    return render_template("admin.html")

@app.route("/sales_account")
def sales_dashboard():
    return render_template("sales.html")

@app.route("/manager")
def manager_dashboard():
    return render_template("manager.html")

@app.route("/cashier")
def cashier_dashboard():
    return render_template("cashier.html")

if __name__ == "__main__":
    app.run(debug=True)
