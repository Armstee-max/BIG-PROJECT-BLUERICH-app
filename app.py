from flask import Flask, render_template

app = Flask(__name__)

@app.route("/signin")
def sign_in():
    return render_template("signin.html")

@app.route("/signup")
def sign_up():
    return render_template("signup.html")

@app.route("/admin")
def admin_dashboard():
    return render_template("admin.html")

@app.route("/sales_staff")
def sales_dashboard():
    return render_template("sales.html")

@app.route("/manager")
def manager_dashboard():
    return render_template("manager.html")

if __name__ == "__main__":
    app.run(debug=True)
