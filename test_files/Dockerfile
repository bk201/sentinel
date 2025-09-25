# Use Ubuntu 22.04 as the base image
FROM ubuntu:22.04

# Set working directory
WORKDIR /app

# Update package list and install dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip3 install opencv-python numpy

# Copy the Python script into the container
COPY counting_video.py .

# Command to run the Python script
CMD ["python3", "counting_video.py"]
