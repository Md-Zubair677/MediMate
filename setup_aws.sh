#!/bin/bash
# MediMate AWS Setup Script - Run this yourself with your credentials

echo "🏥 MediMate AWS Hackathon Setup"
echo "================================"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Installing..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
fi

# Check AWS credentials
echo "🔑 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured."
    echo "Run: aws configure"
    echo "Enter your Access Key ID and Secret Access Key"
    exit 1
fi

echo "✅ AWS credentials configured"

# Set region to us-east-1 (cheapest)
export AWS_DEFAULT_REGION=us-east-1

# Enable Bedrock model access
echo "🤖 Enabling Bedrock models..."
echo "Go to AWS Console > Bedrock > Model Access"
echo "Enable: anthropic.claude-3-5-sonnet-20241022-v2:0"
read -p "Press Enter when Bedrock access is enabled..."

# Deploy infrastructure
echo "🚀 Deploying AWS infrastructure..."
aws cloudformation create-stack \
  --stack-name medimate-hackathon \
  --template-body file://aws/cloudformation/hackathon-minimal.yaml \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

echo "⏳ Waiting for stack creation..."
aws cloudformation wait stack-create-complete \
  --stack-name medimate-hackathon \
  --region us-east-1

# Get outputs
echo "📋 Getting stack outputs..."
aws cloudformation describe-stacks \
  --stack-name medimate-hackathon \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' \
  --output table

# Create billing alarm
echo "💰 Setting up budget alert..."
aws cloudwatch put-metric-alarm \
  --alarm-name "MediMate-Budget-Alert" \
  --alarm-description "Alert when costs exceed $25" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 25 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1

echo "✅ Setup complete!"
echo "💡 Update backend/.env with the stack outputs above"
echo "🎯 Your $100 budget is ready for 60+ demo sessions!"