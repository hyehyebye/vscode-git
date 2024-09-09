from flask import Flask, render_template, jsonify
from neo4j import GraphDatabase

# Neo4j 설정
uri = "neo4j://192.168.13.68:7689"
user = "neo4j"
password = "keisha587587!"  # 실제 비밀번호로 교체하세요.

# Flask 애플리케이션 초기화
app = Flask(__name__)

# Neo4j 드라이버 초기화
driver = GraphDatabase.driver(uri, auth=(user, password))

# 쿼리 실행 함수
def get_projects():
    query = "MATCH (n:Project) RETURN n LIMIT 25"
    with driver.session() as session:
        results = session.run(query)
        return [
            {
                "id": record["n"]["id"],
                "name": record["n"]["name"].encode('utf-8').decode('unicode_escape') if record["n"]["name"] else None
            }
            for record in results
        ]

# API 엔드포인트
@app.route("/api/projects")
def api_projects():
    projects = get_projects()
    return jsonify(projects)

# 라우트 설정
@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
