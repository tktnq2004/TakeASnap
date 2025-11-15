from flask import Flask, request, jsonify
from PIL import Image
import io, base64, numpy as np, cv2
from rembg import remove, new_session

app = Flask(__name__)
session = new_session("u2net")

def img_to_base64(img_pil):
    buf = io.BytesIO()
    img_pil.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")

@app.route("/segment", methods=["POST"])
def segment():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image_file = request.files["image"]
    img = Image.open(image_file.stream).convert("RGB")

    # 🧠 Cắt foreground (người)
    fg = remove(img, session=session)  # RGBA

    # ⚙️ Tạo mask
    fg_rgba = np.array(fg)
    alpha = fg_rgba[:, :, 3]  # 0–255, người=255, nền=0
    mask_inv = cv2.bitwise_not(alpha)

    img_np = np.array(img)

    # 🔹 Tạo background RGBA: giữ phần nền, phần người = trong suốt
    bg_rgba = np.dstack([img_np, mask_inv])  # add alpha channel từ mask_inv

    bg = Image.fromarray(bg_rgba, mode="RGBA")

    # 🧩 Encode base64
    fg_b64 = img_to_base64(fg)
    bg_b64 = img_to_base64(bg)

    return jsonify({"fg": fg_b64, "bg": bg_b64})


if __name__ == "__main__":
    print("🚀 Flask U2Net segmentation API running at: http://192.168.1.5:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
