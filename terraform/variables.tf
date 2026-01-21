variable "region" {
  description = "AWS Region to deploy to"
  default     = "us-east-2"
}

variable "instance_type" {
  description = "EC2 Instance Type"
  default     = "t3.medium"
}
