from flask import Flask, render_template, send_from_directory
app = Flask(__name__)

@app.route("/")
def hello():
	return render_template("index.html")

@app.route("/apple-touch-icon.png")
def icon():
	return send_from_directory(os.path.join(app.root_path, 'static'), 'apple-touch-icon.png')

if __name__ == "__main__":
    app.run(host='0.0.0.0')