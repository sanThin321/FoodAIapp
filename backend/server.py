from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

app = Flask(__name__)
CORS(app)

# Load model and tokenizer
MODEL_NAME = "flax-community/t5-recipe-generation"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=True)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

def skip_special_tokens(text, special_tokens):
    for token in special_tokens:
        text = text.replace(token, "")
    return text

def target_postprocessing(texts, special_tokens):
    if not isinstance(texts, list):
        texts = [texts]

    new_texts = []
    for text in texts:
        text = skip_special_tokens(text, special_tokens)
        text = text.replace("<sep>", "--").replace("<section>", "\n")
        new_texts.append(text)

    return new_texts

@app.route('/generate-recipe', methods=['POST'])
def generate_recipe():
    try:
        data = request.json
        ingredients = data.get('ingredients', '')

        if not ingredients:
            return jsonify({"error": "No ingredients provided"}), 400

        # Prepare input
        prefix = "items: "
        inputs = prefix + ingredients

        # Tokenize
        encoded_inputs = tokenizer(
            inputs,
            max_length=256,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        ).to(device)

        # Generate
        generation_kwargs = {
            "max_length": data.get('max_length', 512),
            "min_length": data.get('min_length', 64),
            "no_repeat_ngram_size": data.get('no_repeat_ngram_size', 3),
            "do_sample": data.get('do_sample', True),
            "top_k": data.get('top_k', 60),
            "top_p": data.get('top_p', 0.95),
            "temperature": 0.7
        }

        with torch.no_grad():
            output_ids = model.generate(
                input_ids=encoded_inputs.input_ids,
                attention_mask=encoded_inputs.attention_mask,
                **generation_kwargs
            )

        # Decode and process
        generated = tokenizer.batch_decode(output_ids, skip_special_tokens=False)
        special_tokens = tokenizer.all_special_tokens
        generated_recipe = target_postprocessing(generated, special_tokens)[0]

        return jsonify({
            "recipe": generated_recipe,
            "ingredients": ingredients
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)