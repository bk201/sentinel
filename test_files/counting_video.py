import cv2
import numpy as np
import os

# Create output directory if it doesn't exist
output_dir = "output"
os.makedirs(output_dir, exist_ok=True)

# Video settings
width, height = 1280, 960
fps = 1  # 1 frame per second
fourcc = cv2.VideoWriter_fourcc(*"mp4v")  # H.264 compatible codec

# Font settings
font = cv2.FONT_HERSHEY_SIMPLEX
font_scale_count = 5  # For counting number
font_scale_label = 2  # For top and bottom labels
thickness_count = 10
thickness_label = 3

# Video configurations for each video in a group
video_configs = [
    {"filename": "front.mp4", "bg_color": (255, 0, 0), "text_color": (255, 255, 255), "top_label": "Front"},
    {"filename": "back.mp4", "bg_color": (0, 165, 255), "text_color": (255, 255, 255), "top_label": "Back"},
    {"filename": "left_repeater.video.mp4", "bg_color": (0, 0, 0), "text_color": (255, 255, 255), "top_label": "Left"},
    {"filename": "right_repeater.mp4", "bg_color": (128, 128, 128), "text_color": (0, 0, 0), "top_label": "Right"},
]

# Groups with different bottom labels, prefixes, and durations
groups = [
    {"bottom_label": "Event file 1", "prefix": "2025-10-12_20-52-00-", "duration": 60},
    {"bottom_label": "Event file 2", "prefix": "2025-10-12_20-53-00-", "duration": 60},
    {"bottom_label": "Event file 3", "prefix": "2025-10-12_20-54-00-", "duration": 30},
]

# Generate videos for each group
for group in groups:
    bottom_label = group["bottom_label"]
    prefix = group["prefix"]
    duration = group["duration"]

    for video in video_configs:
        base_filename = video["filename"]
        temp_file = f"{prefix}{base_filename}"
        final_output = os.path.join(output_dir, f"{prefix}{base_filename}")
        bg_color = video["bg_color"]
        text_color = video["text_color"]
        top_label = video["top_label"]

        # Initialize video writer
        out = cv2.VideoWriter(temp_file, fourcc, fps, (width, height))

        # Generate frames
        for i in range(duration):
            # Create a blank frame
            frame = np.zeros((height, width, 3), dtype=np.uint8)
            frame[:] = bg_color  # Set background color

            # Add counting number in the center
            text = str(i)
            text_size = cv2.getTextSize(text, font, font_scale_count, thickness_count)[0]
            text_x = (width - text_size[0]) // 2
            text_y = (height + text_size[1]) // 2
            cv2.putText(frame, text, (text_x, text_y), font, font_scale_count, text_color, thickness_count)

            # Add top label
            top_size = cv2.getTextSize(top_label, font, font_scale_label, thickness_label)[0]
            top_x = (width - top_size[0]) // 2
            top_y = 150  # Near the top
            cv2.putText(frame, top_label, (top_x, top_y), font, font_scale_label, text_color, thickness_label)

            # Add bottom label
            bottom_size = cv2.getTextSize(bottom_label, font, font_scale_label, thickness_label)[0]
            bottom_x = (width - bottom_size[0]) // 2
            bottom_y = height - 150  # Near the bottom
            cv2.putText(frame, bottom_label, (bottom_x, bottom_y), font, font_scale_label, text_color, thickness_label)

            # Write frame to video
            out.write(frame)

        # Release video writer
        out.release()

        # Re-encode with FFmpeg to ensure H.264 codec
        os.system(f"ffmpeg -i {temp_file} -c:v libx264 -preset fast -crf 23 -c:a aac -loglevel error {final_output}")

        # Remove intermediate file
        if os.path.exists(temp_file):
            os.remove(temp_file)

        print(f"Video saved as {final_output}")
