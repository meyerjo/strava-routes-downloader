FROM python:3.9-slim-buster

WORKDIR /src

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY src/ .
COPY config/ .

CMD [ "python3", "-m", "flask", "run", "--host=0.0.0.0"]