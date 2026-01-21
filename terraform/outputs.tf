output "instance_public_ip" {
  description = "Public IP of the created EC2 instance"
  value       = aws_instance.skillhub_server.public_ip
}

output "instance_id" {
  description = "Instance ID for SSM access"
  value       = aws_instance.skillhub_server.id
}
