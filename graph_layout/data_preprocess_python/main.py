import csv
import json


def get_all_authors(papers):
    authors = set()
    for paper in papers:
        # list(map(lambda x: authors.add(x), paper['Authors'].split(',')))
        authors.update(map(lambda x: x.strip(), paper['Authors'].split(',')))
    return authors


def get_author_graph(authors, papers):
    author_graph_info = {}
    for author in authors:
        author_graph_info[author] = {
            'paper_num': 0,
            'related_authors': set()
        }
    for paper in papers:
        cur_authors = list(map(lambda x: x.strip(), paper['Authors'].split(',')))
        for idx, val in enumerate(cur_authors):
            author_graph_info[val]['paper_num'] += 1
            for a in cur_authors[idx + 1:]:
                author_graph_info[val]['related_authors'].add(a)
    for val in author_graph_info.values():
        val['related_authors'] = list(val['related_authors'])

    return author_graph_info


def save_json_info(path, json_data):
    with open(path, 'w') as f:
        json.dump(json_data, f, ensure_ascii=False, sort_keys=True, indent=4)


def main():
    with open('scopus_visual_analytics_part1.csv', newline='') as f:
        reader = csv.DictReader(f)
        paper_list = [row for row in reader]
    authors = get_all_authors(paper_list)
    save_json_info('author_graph.json', get_author_graph(authors, paper_list))


main()
