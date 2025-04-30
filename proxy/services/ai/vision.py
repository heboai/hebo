import base64
import httpx
import io
import logging
from PIL import Image

from schemas.threads import Message, MessageContentType


logger = logging.getLogger(__name__)


async def _encode_image_from_url(url: str) -> str:
    async with httpx.AsyncClient() as client:
        # Download the image
        response = await client.get(url)
        if response.status_code != 200:
            raise Exception(f"Failed to download image from {url}")

        # Encode the image
        return base64.b64encode(response.content).decode()


def _image_url_body(encoded_image: str) -> dict:
    return {
        "type": "image_url",
        "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"},
    }


def _image_data_body(encoded_image: str) -> dict:
    # If the image is already a data URL, use it directly
    if encoded_image.startswith("data:"):
        return {
            "type": "image_url",
            "image_url": {"url": encoded_image},
        }

    # Otherwise, format it as a data URL
    return {
        "type": "image_url",
        "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"},
    }


def _text_body(text: str) -> dict:
    return {"type": "text", "text": text}


def _compress_image_data(image_data: bytes, max_size_mb: float = 3.0) -> bytes:
    """Compress image data if it exceeds the maximum size limit"""
    # Check if the image data is already under the limit
    max_size_bytes = max_size_mb * 1024 * 1024
    if len(image_data) <= max_size_bytes:
        return image_data

    # Decompress image data into a PIL Image
    img = Image.open(io.BytesIO(image_data))

    # Start with original quality
    quality = 95
    output = io.BytesIO()

    # Reduce image size if it's too big
    if img.width > 6400 or img.height > 6400:
        logger.info("Image too big: reducing image size")
        img.thumbnail((6400, 6400))
        img.save(output, format="JPEG", quality=quality, optimize=True)

    # Compress with decreasing quality until size is below limit
    while output.tell() > max_size_bytes and quality > 10:
        logger.info(f"Image too big: reducing quality to {quality}")
        output.seek(0)
        output.truncate(0)
        img.save(output, format="JPEG", quality=quality, optimize=True)
        quality -= 5

    return output.getvalue()


def _ensure_image_size_limit(
    encoded_image: str, is_base64: bool = True, max_size_mb: float = 3.0
) -> str:
    """Ensure the encoded image is below the size limit by compressing if necessary"""
    if is_base64:
        # Decode base64 string to bytes
        try:
            image_data = base64.b64decode(encoded_image)
        except Exception as _:
            # If this isn't valid base64, try stripping data URL prefix
            if encoded_image.startswith("data:"):
                # Extract base64 part from data URL
                _, encoded_part = encoded_image.split(";base64,", 1)
                image_data = base64.b64decode(encoded_part)
            else:
                raise ValueError("Invalid base64 image data")
    else:
        # Already in bytes format
        image_data = encoded_image

    # Compress if needed
    compressed_data = _compress_image_data(
        image_data if isinstance(image_data, bytes) else str(image_data).encode(),
        max_size_mb,
    )

    # Re-encode to base64 if needed
    if is_base64:
        return base64.b64encode(compressed_data).decode()

    # For non-base64 case, we need to ensure we return a string
    if isinstance(compressed_data, bytes):
        try:
            # Try to decode as UTF-8
            return compressed_data.decode()
        except UnicodeDecodeError:
            # If it's not valid UTF-8, encode as base64
            return base64.b64encode(compressed_data).decode()

    return str(compressed_data)


async def get_content_from_human_message(message: Message) -> list:
    content = message.content

    urls = [c.image_url for c in content if c.type == MessageContentType.IMAGE_URL]
    texts = [c.text for c in content if c.type == MessageContentType.TEXT]
    images = [c.image_data for c in content if c.type == MessageContentType.IMAGE]

    content = []
    for image in images:
        if image:
            # Ensure image is under size limit
            compressed_image = _ensure_image_size_limit(image)
            content.append(_image_data_body(compressed_image))

    for url in urls:
        if url and isinstance(url, str):
            encoded_image = await _encode_image_from_url(url)
            # Ensure downloaded image is under size limit
            compressed_image = _ensure_image_size_limit(encoded_image)
            content.append(_image_url_body(compressed_image))

    for text in texts:
        if text:
            content.append(_text_body(text))

    if not content:
        raise ValueError("Message is not human")

    return content
