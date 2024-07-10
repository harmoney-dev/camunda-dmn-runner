FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Set environment variable
ENV PORT=8882

# Expose the port the application runs on
EXPOSE 8882

# Specify the entry point command to run the application
CMD ["npm", "start"]