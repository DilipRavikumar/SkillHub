pipeline {
    agent {
        docker {
            image 'ubuntu:22.04'
            args '-u root'
        }
    }

    environment {
        AWS_DEFAULT_REGION = 'us-east-2'
    }

    stages {
        stage('Setup Tools') {
            steps {
                sh '''
                    apt-get update && apt-get install -y curl unzip python3 python3-pip git
                    # Install Terraform
                    curl -fsSL https://releases.hashicorp.com/terraform/1.5.7/terraform_1.5.7_linux_amd64.zip -o terraform.zip
                    unzip -o terraform.zip -d /tmp
                    mv /tmp/terraform /usr/local/bin/terraform
                    
                    # Install Ansible and dependencies
                    pip3 install ansible boto3 botocore
                    ansible-galaxy collection install community.aws
                    
                    # Install Session Manager Plugin (required for SSM)
                    curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb"
                    dpkg -i session-manager-plugin.deb
                '''
            }
        }

        stage('Terraform Init & Apply') {
            steps {
                dir('terraform') {
                    sh 'terraform init'
                    sh 'terraform validate'
                    sh 'terraform apply -auto-approve'
                    
                    sh 'terraform output -raw instance_id > ../instance_id.txt'
                }
            }
        }

        stage('Ansible Deploy') {
            steps {
                dir('ansible') {
                    script {
                        def instanceId = readFile('../instance_id.txt').trim()
                        
                        sh """
                            echo '[webservers]' > inventory
                            echo '${instanceId} ansible_connection=aws_ssm ansible_user=ubuntu ansible_python_interpreter=/usr/bin/python3' >> inventory
                        """
                        
                        sh 'ansible-playbook playbook.yml'
                    }
                }
            }
        }
    }
}
