# EC2 Deployment – Quick Reference

> **Instance hostname**: `api.13-60-56-181.nip.io`  
> **Public IPv4**: `13.60.56.181`

---

## 1. SSH into the server
```bash
ssh ubuntu@13.60.56.181           # or ssh ubuntu@api.13-60-56-181.nip.io
```

### If you see `Permission denied (publickey)`

1. **Use the correct key pair** (stored locally at `~/.ssh/cleantrac.pem`). First fix its permissions, then connect explicitly with the key:
   ```bash
   chmod 400 ~/.ssh/cleantrac.pem          # run once on your machine
   ssh -i ~/.ssh/cleantrac.pem ubuntu@api.13-60-56-181.nip.io
   ```

2. **Ensure the key is loaded in your ssh-agent** (optional):
   ```bash
   ssh-add -l                 # list loaded keys
   ssh-add ~/.ssh/cleantrac.pem
   ```

3. **Add verbosity to debug why authentication fails**:
   ```bash
   ssh -vvv -i ~/.ssh/cleantrac.pem ubuntu@api.13-60-56-181.nip.io
   ```

4. **Verify the server side**: the matching public key should exist as one line in `/home/ubuntu/.ssh/authorized_keys`.

5. **Confirm you are using the right login user**:
   * Ubuntu images → `ubuntu`
   * Amazon Linux 2 → `ec2-user`
   * Debian → `admin` or `debian`

The default project directory lives in the Ubuntu home folder.

## 2. Activate the project environment
```bash
cd ~/cleantrac_cleaning_schedule   # project root
source venv/bin/activate           # prompt becomes (venv) ubuntu@ip-…:~/cleantrac_cleaning_schedule$
```

## 3. Manage the production Gunicorn service
The Django backend runs via **systemd** under the service name `cleantrac`.

```bash
sudo systemctl start   cleantrac   # start if stopped
sudo systemctl restart cleantrac   # reload newer code / config
sudo systemctl stop    cleantrac   # stop the service
sudo systemctl status  cleantrac   # view health & recent logs
```

### Tail live logs
```bash
journalctl -u cleantrac -f -n 100   # follow last 100 lines
```

## 4. Local development server (optional)
Inside the virtualenv you can still run:
```bash
python manage.py runserver 0.0.0.0:8000
```
This is **only** for quick debugging; the production site should always use the systemd service.

## 5. Environment variables
All sensitive settings are stored in `/etc/cleantrac.env`.
Load them in a one-off shell with:
```bash
sudo bash -c 'set -a && source /etc/cleantrac.env && set +a && bash'
```

## 6. Confirm the machine’s public IP
```bash
curl -s http://checkip.amazonaws.com
```
(Should return `13.60.56.181`.)

---

### Handy Django management snippets
```bash
# count ReceivingRecord rows
python manage.py shell -c 'from core.receiving_models import ReceivingRecord as R; print(R.objects.count())'
```

---

_Last updated: 2025-07-04_
