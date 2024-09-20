from flask import Flask, jsonify, render_template
from neo4j import GraphDatabase

# Neo4j 설정
uri = "neo4j://192.168.13.68:7689"
user = "neo4j"
password = "keisha587587!"

# Flask 애플리케이션 초기화
app = Flask(__name__)

# Neo4j 드라이버 초기화
driver = GraphDatabase.driver(uri, auth=(user, password))

# 쿼리 실행 함수
def get_projects():
    query = """
    MATCH (n:Project)
    OPTIONAL MATCH (n)-[r]->(m)
    RETURN n, collect({source: id(n), target: id(m)}) AS links
    """
    with driver.session() as session:
        results = session.run(query)
        nodes = []
        links = []
        for record in results:
            node = {
                "id": record["n"].id,
                "gid": record["n"]["gid"],
                "name": record["n"]["name"]
            }
            nodes.append(node)
            links.extend(record["links"])
        return {"nodes": nodes, "links": links}


# 라우트 설정
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/projects", methods=["GET"])
def api_projects():
    data = get_projects()
    response = jsonify(data)
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    return response

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')